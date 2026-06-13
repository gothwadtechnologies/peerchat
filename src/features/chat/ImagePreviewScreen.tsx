import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { X, ZoomIn, ZoomOut, MoreVertical, Download, Share2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function ImagePreviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { imageUrl, senderName } = location.state || {};
  
  const [scale, setScale] = useState(1);
  const [showControls, setShowControls] = useState(true);

  if (!imageUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-black text-white">
        <p>No image to preview</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-white/10 rounded-lg">Go Back</button>
      </div>
    );
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.5, 1));

  return (
    <div className="h-full w-full bg-black flex flex-col relative overflow-hidden select-none">
      {/* Header */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: showControls ? 0 : -100 }}
        className="absolute top-0 inset-x-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-sm">{senderName || 'Image Preview'}</h1>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">GrixChat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
            <ZoomOut size={20} />
          </button>
          <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
            <ZoomIn size={20} />
          </button>
          <button className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
            <div className="flex flex-col gap-0.5">
              <div className="w-1 h-1 bg-white rounded-full" />
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>
          </button>
        </div>
      </motion.div>

      {/* Image Container */}
      <div 
        className="flex-1 flex items-center justify-center overflow-hidden"
        onClick={() => setShowControls(!showControls)}
      >
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.1}
          style={{ scale }}
          className="relative cursor-grab active:cursor-grabbing"
        >
          <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-full max-h-screen object-contain pointer-events-none"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </div>

      {/* Footer Actions */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: showControls ? 0 : 100 }}
        className="absolute bottom-0 inset-x-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-8 flex justify-center gap-8"
      >
        <button className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
          <div className="p-3 bg-white/10 rounded-full"><Download size={20} /></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Save</span>
        </button>
        <button className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
          <div className="p-3 bg-white/10 rounded-full"><Share2 size={20} /></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Share</span>
        </button>
      </motion.div>
    </div>
  );
}
