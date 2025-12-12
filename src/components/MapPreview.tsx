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
        "relative w-full h-40 rounded-2xl overflow-hidden group border-2 border-primary/30 shadow-lg shadow-primary/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20",
        className
      )}
    >
      {/* Animated glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Map background image */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <img
          src="https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-122.4194,37.7749,11,0/800x400@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHJwOWhtYmkwMjR1MmpwZnFuZnk5ZmdhIn0.9Wxs0c6BcEPauFsj_TxmPA"
          alt="Map preview"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
      </div>
      
      {/* Decorative map pins with ripple effect */}
      <div className="absolute top-5 right-14">
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary/30 animate-ping" />
        <div className="relative w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/50" />
      </div>
      <div className="absolute top-10 right-28">
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/20 animate-ping" style={{ animationDelay: '1s' }} />
        <div className="relative w-3 h-3 rounded-full bg-primary/80" />
      </div>
      <div className="absolute bottom-8 right-20">
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary/25 animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="relative w-3 h-3 rounded-full bg-primary/90" />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-5">
        <div className="text-left flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 backdrop-blur-sm flex items-center justify-center border border-primary/30">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Discover <span className="text-primary font-semibold">{listingCount}+</span> listings near you
          </p>
        </div>
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shadow-orange transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]">
          <ArrowRight className="w-6 h-6 text-primary-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}
