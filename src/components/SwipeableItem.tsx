import { ReactNode, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
interface SwipeableItemProps {
  children: ReactNode;
  onDelete?: () => void;
  className?: string;
  deleteThreshold?: number;
}

export function SwipeableItem({ 
  children, 
  onDelete, 
  className,
  deleteThreshold = -80 
}: SwipeableItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef(null);
  const x = useMotionValue(0);
  const { trigger } = useHaptics();
  
  // Transform x position to background opacity and scale
  const deleteOpacity = useTransform(x, [0, deleteThreshold], [0, 1]);
  const deleteScale = useTransform(x, [0, deleteThreshold], [0.5, 1]);
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < deleteThreshold && onDelete) {
      setIsDeleting(true);
      trigger('warning');
      setTimeout(() => {
        onDelete();
      }, 200);
    }
  };

  return (
    <div ref={constraintsRef} className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Delete background */}
      <motion.div 
        className="absolute inset-y-0 right-0 w-24 bg-destructive flex items-center justify-center rounded-r-xl"
        style={{ opacity: deleteOpacity }}
      >
        <motion.div style={{ scale: deleteScale }}>
          <Trash2 className="w-6 h-6 text-destructive-foreground" />
        </motion.div>
      </motion.div>
      
      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={isDeleting ? { x: -400, opacity: 0 } : {}}
        transition={{ type: 'spring', stiffness: 500, damping: 50 }}
        className="relative bg-card touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
