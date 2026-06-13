import express from "express";
import path from "path";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import axios from "axios";
import dotenv from "dotenv";
import multer from "multer";
import FormData from "form-data";
import fs from "fs";
import os from "os";
import { GoogleAuth } from "google-auth-library";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));

// GitHub OAuth Config
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Configure Multer for temporary storage in the OS temp directory
const upload = multer({ 
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "GrixChat Server is running" });
});

// Sitemap route for SEO
app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://grixchat.gothwad.workers.dev/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>https://grixchat.gothwad.workers.dev/tools</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://grixchat.gothwad.workers.dev/chats</loc><priority>0.9</priority><changefreq>always</changefreq></url>
  <url><loc>https://grixchat.gothwad.workers.dev/reels</loc><priority>0.8</priority><changefreq>always</changefreq></url>
</urlset>`);
});

// Digital Asset Links for Android PWA/TWA verification
app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const assetlinksPath = fs.existsSync(path.resolve(process.cwd(), "dist/.well-known/assetlinks.json"))
    ? path.resolve(process.cwd(), "dist/.well-known/assetlinks.json")
    : path.resolve(process.cwd(), "public/.well-known/assetlinks.json");

  if (fs.existsSync(assetlinksPath)) {
    res.sendFile(assetlinksPath);
  } else {
    // Graceful fallback with standard placeholders matching the public file
    res.json([
      {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
          "namespace": "android_app",
          "package_name": "com.gothwad.grixchat",
          "sha256_cert_fingerprints": [
            "F1:A1:DA:3C:A9:74:9C:13:B9:92:EF:CD:AA:E1:92:BB:D4:57:3E:04:9E:FC:D7:E5:A9:DF:11:80:FF:E3:A3:AA"
          ]
        }
      }
    ]);
  }
});

// Send Notification Proxy using Firebase Cloud Messaging HTTP v1 API
app.post("/api/send-notification", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Missing request body" });
    }
    const { tokens, title, body, data } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: "Missing recipient registration tokens" });
    }

    // Ensure all tokens are valid non-empty strings
    const validTokens = tokens.filter(t => typeof t === 'string' && t.trim().length > 0);
    if (validTokens.length === 0) {
      return res.status(400).json({ error: "No valid recipient registration tokens provided" });
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn("FCM Server: FIREBASE_SERVICE_ACCOUNT variable not set. Simulating push notification dispatch in terminal logs.");
      console.log(`[PUSH NOTIFICATION SIMULATION]`);
      console.log(`Title: ${title}`);
      console.log(`Body: ${body}`);
      console.log(`Tokens:`, validTokens);
      return res.json({ 
        success: true, 
        simulated: true, 
        message: "Push simulate successful. Configure FIREBASE_SERVICE_ACCOUNT in env to enable active Google FCM sending." 
      });
    }

    let credentials: any;
    try {
      credentials = JSON.parse(serviceAccountJson);
      if (typeof credentials === 'string') {
        credentials = JSON.parse(credentials);
      }
    } catch (parseErr: any) {
      console.error("FCM Server: Failed to parse FIREBASE_SERVICE_ACCOUNT env value:", parseErr);
      return res.status(500).json({ error: `FIREBASE_SERVICE_ACCOUNT JSON parse failure: ${parseErr.message}` });
    }

    const projectId = credentials?.project_id;
    if (!projectId) {
      throw new Error("project_id missing from FIREBASE_SERVICE_ACCOUNT credentials");
    }

    // Automatically heal literal '\n' sequences in the private key if stored as an escaped string
    if (credentials.private_key && typeof credentials.private_key === 'string') {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    // Authenticate with Google APIs scope for Firebase Cloud Messaging
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });
    const client = await auth.getClient();
    const accessTokenObj = await client.getAccessToken();
    const accessToken = accessTokenObj.token;
    if (!accessToken) {
      throw new Error("Failed to retrieve Google Access Token for FCM scope");
    }

    console.log(`FCM Server: Dispatching push alerts to ${validTokens.length} registration tokens.`);
    const results = await Promise.all(
      validTokens.map(async (token) => {
        try {
          const payload = {
            message: {
              token,
              notification: { title, body },
              data: {
                click_action: data?.click_action || '/chats',
                conversationId: data?.conversationId || '',
                senderId: data?.senderId || '',
                ...(data || {})
              }
            }
          };

          const response = await axios.post(
            `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
            payload,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          return { token, success: true, messageId: response.data?.name };
        } catch (err: any) {
          const safeTokenStr = (typeof token === 'string') ? token.substring(0, 10) : String(token);
          console.error(`FCM Server: Failed to send to token: ${safeTokenStr}... Error:`, err.response?.data || err.message);
          return { token, success: false, error: err.response?.data || err.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    res.json({
      success: true,
      total: validTokens.length,
      sentCount: successCount,
      results
    });
  } catch (error: any) {
    console.error("FCM Send Notification failed:", error);
    res.status(500).json({ error: error.message || "Failed to process push dispatch" });
  }
});

// Secure Server-side Gemini AI Completion Proxy (GrixAI)
app.post("/api/grix-ai", async (req, res) => {
  const { messages, model, modelType } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Server GrixAI Proxy: GEMINI_API_KEY not found in environment.");
    return res.status(400).json({ 
      error: "Gemini API key is not configured on the server. Please register GEMINI_API_KEY in server environment settings." 
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const formattedMessages = Array.isArray(messages) ? messages : [];
    
    // Extract system instruction
    const systemMsg = formattedMessages.find(m => m.role === "system");
    const systemInstruction = systemMsg ? (systemMsg.content || systemMsg.text) : "You are Grix AI, a helpful and friendly assistant for GrixChat.";

    // Format thread to Gemini dynamic-contents array
    const conversationContents = formattedMessages
      .filter(m => m.role !== "system")
      .map(m => {
        const role = (m.role === "assistant" || m.role === "model") ? "model" : "user";
        return {
          role,
          parts: [{ text: m.content || m.text || "" }]
        };
      });

    const mType = model || modelType || 'grix-ai';
    const modelId = "gemini-3.5-flash"; // Active, highly performant, free-tier model

    const response = await ai.models.generateContent({
      model: modelId,
      contents: conversationContents,
      config: {
        systemInstruction,
        temperature: mType === 'grix-ai-pro' ? 1.0 : 0.7,
      }
    });

    const reply = response.text || "I'm sorry, I couldn't process that.";
    res.json({ success: true, reply });
  } catch (error: any) {
    console.error("Server GrixAI SDK Error:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred while communicating with Gemini." 
    });
  }
});

// File Upload Proxy (Catbox for images/videos, Gofile.io for others)
app.post("/api/upload-file", (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ status: 'error', message: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ status: 'error', message: `Unknown upload error: ${err.message}` });
    }
    next();
  });
}, async (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const isMedia = req.file.mimetype.startsWith('image/') || req.file.mimetype.startsWith('video/');

  try {
    if (isMedia) {
      // Upload to Catbox.moe
      const form = new FormData();
      form.append('reqtype', 'fileupload');
      form.append('fileToUpload', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      console.log('Uploading media to Catbox.moe...');
      const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
        timeout: 60000,
      });

      if (response.data && typeof response.data === 'string' && response.data.startsWith('http')) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.json({ 
          status: 'ok', 
          downloadUrl: response.data.trim(),
          provider: 'catbox'
        });
      }
      throw new Error(`Catbox error: ${response.data}`);
    } else {
      // Upload to Gofile.io
      // 1. Get best server
      console.log('Getting Gofile server...');
      const serverRes = await axios.get('https://api.gofile.io/getServer');
      const server = serverRes.data.data.server;

      // 2. Upload
      const form = new FormData();
      form.append('file', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      console.log(`Uploading file to Gofile server: ${server}...`);
      const response = await axios.post(`https://${server}.gofile.io/contents/uploadfile`, form, {
        headers: form.getHeaders(),
        timeout: 120000, // Gofile can be slow for large files
      });

      if (response.data && response.data.status === 'ok') {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.json({ 
          status: 'ok', 
          downloadUrl: response.data.data.downloadPage, // Note: Direct link might require premium for Gofile, so we give download page
          fileId: response.data.data.fileId,
          provider: 'gofile'
        });
      }
      throw new Error(`Gofile error: ${JSON.stringify(response.data)}`);
    }
  } catch (error: any) {
    console.error('Upload failed:', error.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ status: 'error', message: `Upload failed: ${error.message}` });
  }
});

// Debug endpoint
app.get("/api/github/debug", (req, res) => {
  res.json({
    hasClientId: !!GITHUB_CLIENT_ID,
    hasClientSecret: !!GITHUB_CLIENT_SECRET,
    appUrl: process.env.APP_URL || "Not Set",
    platform: "Cloudflare/GCP",
    env: process.env.NODE_ENV
  });
});

// GitHub Auth URL
app.get("/api/github/auth-url", (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    console.error("GITHUB_CLIENT_ID is missing from environment variables.");
    return res.status(500).json({ error: "GITHUB_CLIENT_ID is not set" });
  }
  
  // Better fallback logic for APP_URL
  let appUrl = process.env.APP_URL;
  
  // If APP_URL is missing or looks like a placeholder, try to derive it
  if (!appUrl || !appUrl.startsWith('http')) {
    const host = req.get('host');
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    appUrl = `${protocol}://${host}`;
    console.log(`Derived APP_URL from request: ${appUrl}`);
  }
  
  // Ensure appUrl doesn't end with a slash for consistency
  appUrl = appUrl.replace(/\/$/, "");
  
  const redirectUri = `${appUrl}/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user,workflow&state=${Math.random().toString(36).substring(7)}`;
  
  console.log(`Generated GitHub Auth URL: ${url}`);
  console.log(`Using Redirect URI: ${redirectUri}`);
  
  res.json({ url, redirectUri });
});

// GitHub Callback
app.get(["/auth/github/callback", "/auth/github/callback/"], async (req, res) => {
  const { code } = req.query;
  console.log(`GitHub Callback received with code: ${code ? 'PRESENT' : 'MISSING'}`);
  
  try {
    const response = await axios.post("https://github.com/login/oauth/access_token", {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }, {
      headers: { Accept: "application/json" }
    });

    const accessToken = response.data.access_token;
    if (!accessToken) {
      console.error("Failed to obtain access token from GitHub:", response.data);
      throw new Error("No access token");
    }

    console.log("GitHub Access Token obtained successfully.");

    res.send(`
      <html>
        <head>
          <title>Authenticating...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0; background:#f4f4f5;">
          <script>
            const token = '${accessToken}';
            try {
              localStorage.setItem('github_token', token);
            } catch (e) {
              console.error("Local storage error:", e);
            }

            const message = { type: 'GITHUB_AUTH_SUCCESS', token: token };
            
            if (window.opener) {
              window.opener.postMessage(message, '*');
              // Close after a short delay to ensure message is sent
              setTimeout(() => {
                window.close();
                // Fallback if window.close() is blocked
                document.getElementById('status').innerText = 'Authenticated! You can close this window.';
              }, 500);
            } else {
              // If no opener, don't just redirect inside the popup as it fails outside iframe
              document.getElementById('status').innerText = 'Authenticated! Please return to GrixChat.';
              document.getElementById('loader').style.display = 'none';
              document.getElementById('success-icon').style.display = 'block';
            }
          </script>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:20px;text-align:center;">
            <div id="loader" style="width:48px;height:48px;border:4px solid #e4e4e7;border-top-color:#0494f4;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <div id="success-icon" style="display:none;width:60px;height:60px;background:#0494f4;border-radius:50%;color:white;display:none;align-items:center;justify-content:center;font-size:30px;margin-bottom:20px;">✓</div>
            <p id="status" style="margin-top:24px;font-weight:600;color:#18181b;font-size:16px;">Authenticating with GitHub...</p>
            <p style="margin-top:8px;color:#71717a;font-size:14px;">Securely connecting your accounts</p>
          </div>
          <style>
            @keyframes spin { to { transform: rotate(360deg); } }
            #success-icon { display: none; }
          </style>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Auth failed");
  }
});

// GitHub Push
app.post("/api/github/push", async (req, res) => {
  const { token, owner, repo, path: filePath, content, message, branch = 'main' } = req.body;
  try {
    let sha;
    try {
      const getFileRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        headers: { Authorization: `token ${token}` }
      });
      sha = getFileRes.data.sha;
    } catch (e) {}

    const pushRes = await axios.put(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
      message, content, sha, branch
    }, {
      headers: { Authorization: `token ${token}` }
    });
    res.json(pushRes.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
  }
});

import crypto from "crypto";

// Helper to calculate GitHub's blob SHA
function calculateGitHubSha(contentBase64: string): string {
  const content = Buffer.from(contentBase64, 'base64');
  const header = `blob ${content.length}\0`;
  const store = Buffer.concat([Buffer.from(header), content]);
  return crypto.createHash('sha1').update(store).digest('hex');
}

// GitHub Batch Push (Atomic commit for multiple files)
app.post("/api/github/push-batch", async (req, res) => {
  const { token, owner, repo, files, message, branch = 'main' } = req.body;
  
  try {
    const headers = { 
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    };

    console.log(`Starting smart batch push for ${files.length} files to ${owner}/${repo} on branch ${branch}`);

    // 1. Get the latest commit SHA of the branch
    const branchRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, { headers });
    const parentSha = branchRes.data.commit.sha;
    const baseTreeSha = branchRes.data.commit.commit.tree.sha;

    // 2. Fetch the current recursive tree to compare SHAs
    console.log(`Fetching current tree for comparison...`);
    const existingTreeRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/${baseTreeSha}?recursive=1`, { headers });
    const existingFiles = new Map<string, string>(); // path -> sha
    if (existingTreeRes.data.tree) {
      existingTreeRes.data.tree.forEach((node: any) => {
        if (node.type === 'blob') {
          existingFiles.set(node.path, node.sha);
        }
      });
    }

    // 3. Filter files that actually changed
    const modifiedFiles = files.filter((file: any) => {
      const localSha = calculateGitHubSha(file.content);
      const remoteSha = existingFiles.get(file.path);
      return localSha !== remoteSha;
    });

    console.log(`Smart Sync: ${modifiedFiles.length} of ${files.length} files changed.`);

    if (modifiedFiles.length === 0) {
      return res.json({ 
        message: "No changes detected. Repository is already up to date.",
        noChanges: true 
      });
    }

    // 4. Create blobs for each modified file with concurrency control
    const treeItems = [];
    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_BATCHES = 400; // ms

    for (let i = 0; i < modifiedFiles.length; i += BATCH_SIZE) {
      const batch = modifiedFiles.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(modifiedFiles.length / BATCH_SIZE)} (${batch.length} files)`);
      
      const results = await Promise.all(batch.map(async (file: any) => {
        try {
          const blobRes = await axios.post(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
            content: file.content,
            encoding: 'base64'
          }, { headers });
          
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobRes.data.sha
          };
        } catch (err: any) {
          console.error(`Failed to create blob for ${file.path}:`, err.response?.data || err.message);
          throw new Error(`Failed to upload ${file.path}: ${err.response?.data?.message || err.message}`);
        }
      }));
      
      treeItems.push(...results);
      
      if (i + BATCH_SIZE < modifiedFiles.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    console.log(`Successfully created ${treeItems.length} new blobs. Creating updated tree...`);

    // 5. Create a new tree (basing it on the existing baseTreeSha to merge changes)
    const treeRes = await axios.post(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      base_tree: baseTreeSha,
      tree: treeItems
    }, { headers });

    // 6. Create a new commit
    const commitRes = await axios.post(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      message,
      tree: treeRes.data.sha,
      parents: [parentSha]
    }, { headers });

    // 7. Update the branch reference
    const refRes = await axios.patch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      sha: commitRes.data.sha,
      force: false
    }, { headers });

    console.log(`Successfully updated reference for branch ${branch}`);
    res.json(refRes.data);
  } catch (error: any) {
    console.error("Smart Batch Push error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: error.message });
  }
});

// Retrieve list of codebase files for Sync Tool
app.get("/api/github/list-files", (req, res) => {
  const listAllFiles = (dir: string, fileList: string[] = []): string[] => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        const baseName = path.basename(file);
        if (!baseName.startsWith('.') && baseName !== 'node_modules' && baseName !== 'dist' && baseName !== '.git' && baseName !== 'tmp') {
          listAllFiles(filePath, fileList);
        }
      } else {
        const relativePath = path.relative(process.cwd(), filePath);
        fileList.push(relativePath);
      }
    });
    return fileList;
  };
  try {
    const allFiles = listAllFiles(process.cwd());
    res.json({ files: allFiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Retrieve localized file content for Sync Tool
app.get("/api/github/get-file-content", (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: "Path is required" });
  
  // Normalize path to prevent directory traversal
  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!resolvedPath.startsWith(process.cwd())) {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: "File not found" });
    }
    const content = fs.readFileSync(resolvedPath, 'base64');
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite / Static handling
if (process.env.NODE_ENV !== "production") {
  // Dynamic import for development
  import("vite").then(({ createServer }) => {
    createServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
    });
  });
} else {
  const distPath = path.resolve(process.cwd(), "dist");
  app.use(express.static(distPath, { dotfiles: "allow" }));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Start server
const PORT = 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Dynamic memory map for WebRTC P2P Room client relay
// RoomId -> (PeerId -> peer reference)
const rooms = new Map<string, Map<string, { ws: any; peerName: string }>>();

wss.on('connection', (ws: any) => {
  let currentRoomId: string | null = null;
  let currentPeerId: string | null = null;

  ws.on('message', (messageStr: string) => {
    try {
      const msg = JSON.parse(messageStr.toString());
      
      switch (msg.type) {
        case 'join-room': {
          const { roomId, peerId, peerName } = msg;
          currentRoomId = roomId;
          currentPeerId = peerId;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }
          const roomPeers = rooms.get(roomId)!;
          roomPeers.set(peerId, { ws, peerName });

          console.log(`[P2P server] Peer '${peerName}' (${peerId}) joined room: ${roomId}`);

          // Notify other peers in the room
          roomPeers.forEach((peer, existingPeerId) => {
            if (existingPeerId !== peerId && peer.ws.readyState === 1 /* OPEN */) {
              // Inform existing peer about newcomer
              peer.ws.send(JSON.stringify({
                type: 'peer-joined',
                peerId,
                peerName
              }));
              // Inform newcomer about existing peer
              ws.send(JSON.stringify({
                type: 'peer-exists',
                peerId: existingPeerId,
                peerName: peer.peerName
              }));
            }
          });
          break;
        }

        case 'signal': {
          const { roomId, targetPeerId, data, senderPeerId } = msg;
          const roomPeers = rooms.get(roomId);
          if (roomPeers) {
            const targetPeer = roomPeers.get(targetPeerId);
            if (targetPeer && targetPeer.ws.readyState === 1 /* OPEN */) {
              targetPeer.ws.send(JSON.stringify({
                type: 'signal',
                senderPeerId,
                data
              }));
            }
          }
          break;
        }

        case 'chat-message': {
          // Fallback server broadcast to ensure 100% messaging reliability if WebRTC is blocked
          const { roomId, senderPeerId, senderName, text, fileUrl, fileType, fileName, id, replyTo } = msg;
          const roomPeers = rooms.get(roomId);
          if (roomPeers) {
            roomPeers.forEach((p, pid) => {
              if (pid !== senderPeerId && p.ws.readyState === 1 /* OPEN */) {
                p.ws.send(JSON.stringify({
                  type: 'chat-message',
                  roomId,
                  senderPeerId,
                  senderName,
                  text,
                  fileUrl,
                  fileType,
                  fileName,
                  id,
                  replyTo,
                  createdAt: new Date().toISOString()
                }));
              }
            });
          }
          break;
        }

        case 'call-signal': {
          const { roomId, targetPeerId, senderPeerId, signalType } = msg;
          const roomPeers = rooms.get(roomId);
          if (roomPeers) {
            const targetPeer = roomPeers.get(targetPeerId);
            if (targetPeer && targetPeer.ws.readyState === 1 /* OPEN */) {
              targetPeer.ws.send(JSON.stringify({
                type: 'call-signal',
                senderPeerId,
                signalType
              }));
            }
          }
          break;
        }
      }
    } catch (e) {
      console.error("WS error parsing message:", e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && currentPeerId) {
      const roomPeers = rooms.get(currentRoomId);
      if (roomPeers) {
        roomPeers.delete(currentPeerId);
        console.log(`[P2P server] Peer (${currentPeerId}) left room: ${currentRoomId}`);
        if (roomPeers.size === 0) {
          rooms.delete(currentRoomId);
        } else {
          // Notify remaining peers
          roomPeers.forEach((peer) => {
            if (peer.ws.readyState === 1 /* OPEN */) {
              peer.ws.send(JSON.stringify({
                type: 'peer-left',
                peerId: currentPeerId
              }));
            }
          });
        }
      }
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running with WebSocket WebRTC signaling on HTTP & WS port ${PORT}`);
});

export default app;
