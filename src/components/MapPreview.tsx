import { MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapPreviewProps {
  listingCount?: number;
  className?: string;
  onClick?: () => void;
}

export function MapPreview({ 
  listingCount = 450, 
  className,
  onClick 
}: MapPreviewProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative w-full h-36 rounded-2xl overflow-hidden group",
        className
      )}
    >
      {/* Map background image */}
      <img
        src="https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-122.4194,37.7749,11,0/800x400@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHJwOWhtYmkwMjR1MmpwZnFuZnk5ZmdhIn0.9Wxs0c6BcEPauFsj_TxmPA"
        alt="Map preview"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/50 to-background/30" />
      
      {/* Decorative map pins */}
      <div className="absolute top-4 right-16 w-3 h-3 rounded-full bg-primary/80 animate-pulse" />
      <div className="absolute top-8 right-24 w-2 h-2 rounded-full bg-primary/60" />
      <div className="absolute bottom-6 right-20 w-2.5 h-2.5 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: '0.5s' }} />
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-5">
        <div className="text-left flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Explore on Map</h3>
            <p className="text-sm text-muted-foreground">
              {listingCount}+ listings near you
            </p>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-orange transition-transform group-hover:scale-110">
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </button>
  );
}
