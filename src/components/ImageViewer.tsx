import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface ImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export function ImageViewer({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose,
  alt = 'Image'
}: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  // Reset state when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetZoom();
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    resetZoom();
  }, [currentIndex]);

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev / 1.5, 1);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) {
      resetZoom();
    } else {
      // Zoom into click position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setScale(2.5);
        setPosition({ x: -x * 0.5, y: -y * 0.5 });
      }
    }
  };

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => {
      const newScale = Math.min(Math.max(prev * delta, 1), 5);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, []);

  // Handle touch events for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.hypot(dx, dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.hypot(dx, dy);
      const delta = distance / lastTouchDistance.current;
      
      setScale(prev => Math.min(Math.max(prev * delta, 1), 5));
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging && dragStart.current && scale > 1) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    }
  }, [isDragging, scale]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = null;
    lastTouchCenter.current = null;
    setIsDragging(false);
    dragStart.current = null;
    
    // Reset position if zoomed out
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragStart.current && scale > 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({
        x: dragStart.current.posX + dx,
        y: dragStart.current.posY + dy,
      });
    }
  }, [isDragging, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < images.length - 1) {
            setCurrentIndex(prev => prev + 1);
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, onClose]);

  // Add wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (isOpen && container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen, handleWheel]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95"
        onClick={(e) => {
          if (e.target === e.currentTarget && scale === 1) onClose();
        }}
      >
        {/* Header controls */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent safe-top">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          
          {images.length > 1 && (
            <span className="text-white font-medium">
              {currentIndex + 1} / {images.length}
            </span>
          )}
          
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleZoomOut}
              disabled={scale <= 1}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={handleZoomIn}
              disabled={scale >= 5}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            {scale > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={resetZoom}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Image container */}
        <div
          ref={containerRef}
          className={cn(
            "absolute inset-0 flex items-center justify-center overflow-hidden",
            scale > 1 ? "cursor-grab" : "cursor-zoom-in",
            isDragging && "cursor-grabbing"
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        >
          <motion.img
            ref={imageRef}
            key={currentIndex}
            src={images[currentIndex]}
            alt={`${alt} - ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            draggable={false}
          />
        </div>

        {/* Navigation arrows */}
        {images.length > 1 && scale === 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20",
                currentIndex === 0 && "opacity-30 pointer-events-none"
              )}
              onClick={goToPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20",
                currentIndex === images.length - 1 && "opacity-30 pointer-events-none"
              )}
              onClick={goToNext}
              disabled={currentIndex === images.length - 1}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </>
        )}

        {/* Thumbnails */}
        {images.length > 1 && scale === 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent safe-bottom">
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                    idx === currentIndex
                      ? "border-white opacity-100 scale-105"
                      : "border-transparent opacity-60 hover:opacity-80"
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zoom indicator */}
        {scale > 1 && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
            {Math.round(scale * 100)}%
          </div>
        )}

        {/* Touch hint */}
        {scale === 1 && (
          <p className="absolute bottom-28 left-1/2 -translate-x-1/2 text-white/60 text-xs">
            Double-tap or pinch to zoom
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
