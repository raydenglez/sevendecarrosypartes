import { Heart, MapPin, Gauge, Star } from 'lucide-react';
import { Listing } from '@/types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { CSSProperties } from 'react';

interface ListingCardProps {
  listing: Listing;
  variant?: 'featured' | 'list';
  className?: string;
  style?: CSSProperties;
}

export function ListingCard({ listing, variant = 'featured', className, style }: ListingCardProps) {
  const isFeatured = variant === 'featured';

  if (variant === 'list') {
    return (
      <Link 
        to={`/listing/${listing.id}`}
        className={cn(
          "flex gap-4 p-3 bg-card rounded-xl transition-all duration-200 hover:bg-card-elevated",
          className
        )}
        style={style}
      >
        <div className="relative w-28 h-24 rounded-lg overflow-hidden shrink-0">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
            <button className="p-1 text-muted-foreground hover:text-primary transition-colors">
              <Heart className="w-5 h-5" />
            </button>
          </div>
          {listing.vehicleAttributes && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {listing.vehicleAttributes.fuelType.charAt(0).toUpperCase() + listing.vehicleAttributes.fuelType.slice(1)} • {listing.vehicleAttributes.transmission.charAt(0).toUpperCase() + listing.vehicleAttributes.transmission.slice(1)}
            </p>
          )}
          {listing.serviceAttributes && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {listing.serviceAttributes.serviceCategory}
            </p>
          )}
          <p className="text-primary font-bold text-lg mt-1">
            ${listing.price.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
            <MapPin className="w-3 h-3" />
            <span>{listing.location.city} • {listing.distance} mi away</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/listing/${listing.id}`}
      className={cn(
        "block w-[280px] shrink-0 bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-elevated group",
        className
      )}
      style={style}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {listing.isPremium && (
          <span className="absolute top-3 left-3 carnexo-badge-premium">
            PREMIUM
          </span>
        )}
        {listing.type === 'service' && (
          <span className="absolute top-3 left-3 carnexo-badge-service">
            SERVICE
          </span>
        )}
        <button 
          className="absolute top-3 right-3 p-2 rounded-full bg-background/20 backdrop-blur-sm text-foreground hover:bg-background/40 transition-all"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
        <p className="text-primary font-bold text-lg mt-1">
          {listing.type === 'service' && listing.serviceAttributes?.priceStructure === 'Starting from' && 'From '}
          ${listing.price.toLocaleString()}
        </p>
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          {listing.vehicleAttributes && (
            <div className="flex items-center gap-1">
              <Gauge className="w-4 h-4" />
              <span>{Math.round(listing.vehicleAttributes.mileage / 1000)}k mi</span>
            </div>
          )}
          {listing.type === 'service' && listing.owner && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span>{listing.owner.ratingAvg} ({listing.owner.totalReviews})</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{listing.distance} mi</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
