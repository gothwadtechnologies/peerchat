import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, Trash2, Send, CameraOff, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../../contexts/ThemeContext';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, caption: string) => void;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCapturedImg(reader.result);
          // Stop stream if active when choosing from gallery too
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Initialize and update webcam stream
  const startCamera = useCallback(async () => {
    try {
      setErrorMsg(null);
      setIsReady(false);

      // Stop previous stream if active
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Error starting camera:', err);
      // Fallback message encouraging selecting a photo instead
      setErrorMsg(
        'Camera could not be accessed. Please ensure microphone/camera permissions are enabled or try using GrixChat in a direct browser tab.'
      );
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen && !capturedImg) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode, capturedImg]);

  // Clean raw tracks on close
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCapturedImg(null);
    setCaption('');
    setErrorMsg(null);
    onClose();
  };

  // Toggle Flip Facing Mode
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Snap Frame handler
  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Symmetrical scale for selfie view to look premium and natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImg(dataUrl);

    // Stop streams to save hardware resources while editing/capturing
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Confirm and Send Photo
  const handleSend = () => {
    if (!capturedImg) return;
    try {
      const uniqueFilename = `captured_img_${Date.now()}.jpg`;
      const file = dataURLtoFile(capturedImg, uniqueFilename);
      onCapture(file, caption);
      handleClose();
    } catch (err) {
      console.error('Error preparing image file:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 w-screen bg-black z-[9999] flex flex-col justify-between overflow-hidden select-none"
        style={{ height: 'var(--true-height, 100dvh)' }}
      >
        {/* Top Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <span className="text-white font-medium text-[15px]">
            {capturedImg ? 'Preview Media' : 'Grix Capture'}
          </span>

          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Mid Viewfinder / Captured Screen */}
        <div className="relative flex-1 min-h-0 w-full bg-black flex items-center justify-center overflow-hidden">
          {!capturedImg ? (
            errorMsg ? (
              <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-400 gap-4 max-w-sm">
                <CameraOff size={48} className="text-zinc-600" />
                <p className="text-[14px] leading-relaxed">{errorMsg}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-full text-[13px] font-bold shadow-md transition-all active:scale-95"
                >
                  Retry Camera Access
                </button>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onLoadedMetadata={() => setIsReady(true)}
                  className={`w-full h-full object-cover ${
                    facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />
                {!isReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )
          ) : (
            <img
              src={capturedImg}
              alt="Captured Frame Preview"
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Bottom Actions Frame */}
        <div className="bg-black/85 p-4 pb-safe flex flex-col gap-4 z-10 shrink-0">
          {capturedImg ? (
            /* Confirm Screen controls */
            <div className="flex flex-col gap-3 w-full max-w-lg mx-auto">
              {/* Caption field */}
              <div className="flex items-center bg-[#1c1c1e] text-zinc-100 rounded-full px-4 py-2 border border-white/5 transition-all w-full shadow-sm">
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="bg-transparent flex-grow text-[15px] outline-none text-zinc-100 placeholder:text-zinc-500 py-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  autoFocus
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center w-full px-4">
                <button
                  type="button"
                  onClick={() => {
                    setCapturedImg(null);
                    setCaption('');
                  }}
                  className="w-12 h-12 flex items-center justify-center bg-zinc-800 text-white rounded-full hover:bg-zinc-700 active:scale-95 transition-all shadow-md"
                >
                  <Trash2 size={22} className="text-red-400" />
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  className="w-14 h-14 flex items-center justify-center bg-sky-500 hover:bg-sky-600 text-white rounded-full active:scale-95 transition-all shadow-lg"
                >
                  <Send size={24} className="ml-0.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera viewfinder controls */
            !errorMsg && (
              <div className="flex justify-between items-center w-full max-w-sm mx-auto px-6 py-2">
                {/* Gallery option slot on the left */}
                <div>
                  <input
                    type="file"
                    ref={galleryInputRef}
                    className="hidden"
                    onChange={handleGallerySelect}
                    accept="image/*,video/*"
                  />
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-white border border-white/10 active:scale-95 transition-all shadow-md cursor-pointer"
                    title="Choose from Gallery"
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>

                {/* Snapper button */}
                <button
                  type="button"
                  onClick={takePhoto}
                  className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center p-1 active:scale-90 transition-all cursor-pointer"
                >
                  <div className="w-full h-full bg-white rounded-full hover:bg-white/90" />
                </button>

                {/* Flip Camera trigger */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-white border border-white/10 active:rotate-180 transition-all duration-300 shadow-md"
                  title="Flip camera"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            )
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
