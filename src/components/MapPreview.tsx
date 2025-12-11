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
        "relative w-full h-32 rounded-2xl overflow-hidden group",
        className
      )}
    >
      {/* Map background image */}
      <img
        src="https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-122.4194,37.7749,11,0/800x400@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHJwOWhtYmkwMjR1MmpwZnFuZnk5ZmdhIn0.9Wxs0c6BcEPauFsj_TxmPA"
        alt="Map preview"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-5">
        <div className="text-left">
          <h3 className="text-lg font-bold text-foreground">View Map</h3>
          <p className="text-sm text-muted-foreground">
            Explore {listingCount}+ vehicles in your area
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-orange transition-transform group-hover:scale-110">
          <ArrowRight className="w-5 h-5 text-primary-foreground" />
        </div>
      </div>
    </button>
  );
}
