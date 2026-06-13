// GrixChat Firebase Cloud Messaging Service Worker (Dynamic Client Portable Mode)
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Extract config passed down as search params during service worker registration path
const urlParams = new URL(location.href).searchParams;

const config = {
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId')
};

if (config.apiKey && config.projectId) {
  firebase.initializeApp(config);
  
  try {
    const messaging = firebase.messaging();
    
    // Background message receiver
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message: ', payload);
      
      const title = payload.notification?.title || payload.data?.title || 'GrixChat';
      const body = payload.notification?.body || payload.data?.body || 'New alert received';
      const icon = payload.notification?.icon || payload.data?.icon || '/assets/icon-192.png';
      
      const options = {
        body: body,
        icon: icon,
        badge: '/assets/icon-192.png',
        tag: payload.data?.conversationId || 'grixchat-msg',
        renotify: true,
        data: {
          click_action: payload.data?.click_action || '/chats',
          conversationId: payload.data?.conversationId
        }
      };
      
      self.registration.showNotification(title, options);
    });
  } catch (err) {
    console.error('Failed to initialize messaging in FCM Service Worker:', err);
  }
} else {
  console.log('FCM Service Worker: Standing by, waiting for client parameters to initialize...');
}

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = event.notification.data?.click_action || '/chats';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Look for open tab and focus if matching
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
