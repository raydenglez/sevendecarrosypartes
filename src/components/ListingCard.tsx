import { Heart, MapPin, Gauge, Star, Megaphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { CSSProperties } from 'react';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useHaptics } from '@/hooks/useHaptics';
interface ListingCardProps {
  listing: Listing;
  variant?: 'featured' | 'list' | 'grid';
  className?: string;
  style?: CSSProperties;
}

export function ListingCard({ listing, variant = 'featured', className, style }: ListingCardProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const favorited = isFavorite(listing.id);
  const { trigger } = useHaptics();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trigger(favorited ? 'light' : 'success');
    toggleFavorite(listing.id);
  };

  // Grid variant - Facebook Marketplace style
  if (variant === 'grid') {
    return (
      <Link
        to={`/listing/${listing.id}`}
        className={cn(
          "block bg-card rounded-xl overflow-hidden transition-all duration-200 hover:bg-card-elevated",
          listing.isSponsored && "ring-2 ring-warning shadow-orange",
          className
        )}
        style={style}
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className={cn("w-full h-full object-cover", listing.status !== 'active' && "opacity-60")}
          />
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg text-sm">{t('listing.sold')}</span>
            </div>
          )}
          {listing.status === 'draft' && (
            <span className="absolute top-2 left-2 bg-yellow-500 text-yellow-950 text-[10px] font-bold px-1.5 py-0.5 rounded">
              {t('listing.draft')}
            </span>
          )}
          {listing.status === 'expired' && (
            <span className="absolute top-2 left-2 bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              {t('listing.expired')}
            </span>
          )}
          {listing.status === 'active' && listing.isSponsored && (
            <span className="absolute top-2 left-2 carnexo-badge-sponsored text-[10px] px-1.5 py-0.5 flex items-center gap-1">
              <Megaphone className="w-3 h-3" />
              {t('listing.sponsored')}
            </span>
          )}
          {listing.status === 'active' && listing.isPremium && !listing.isSponsored && (
            <span className="absolute top-2 left-2 carnexo-badge-premium text-[10px] px-1.5 py-0.5">
              {t('listing.premium')}
            </span>
          )}
          {listing.status === 'active' && listing.type === 'service' && !listing.isPremium && !listing.isSponsored && (
            <span className="absolute top-2 left-2 carnexo-badge-service text-[10px] px-1.5 py-0.5">
              {t('listing.service')}
            </span>
          )}
          <button 
            className={cn(
              "absolute top-2 right-2 p-2.5 rounded-full bg-background/30 backdrop-blur-sm transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center",
              favorited ? "text-primary" : "text-foreground hover:bg-background/50"
            )}
            onClick={handleFavoriteClick}
          >
            <Heart className={cn("w-5 h-5", favorited && "fill-current")} />
          </button>
        </div>
        <div className="p-2.5">
          <p className="text-primary font-bold text-base">
            {listing.type === 'service' && listing.serviceAttributes?.priceStructure === 'Starting from' && 'From '}
            ${listing.price.toLocaleString()}
          </p>
          <h3 className="font-medium text-foreground text-sm truncate mt-0.5">{listing.title}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
            <MapPin className="w-3 h-3" />
            <span>{listing.location.city} • {listing.distance} {t('common.mi')}</span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <Link 
        to={`/listing/${listing.id}`}
        className={cn(
          "flex gap-4 p-3 bg-card rounded-xl transition-all duration-200 hover:bg-card-elevated",
          listing.isSponsored && "ring-2 ring-warning shadow-orange",
          className
        )}
        style={style}
      >
        <div className="relative w-28 h-24 rounded-lg overflow-hidden shrink-0">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className={cn("w-full h-full object-cover", listing.status !== 'active' && "opacity-60")}
          />
          {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="bg-primary text-primary-foreground font-bold px-2 py-1 rounded text-xs">{t('listing.sold')}</span>
            </div>
          )}
          {listing.status === 'draft' && (
            <span className="absolute top-1 left-1 bg-yellow-500 text-yellow-950 text-[9px] font-bold px-1 py-0.5 rounded">
              {t('listing.draft')}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
            <button 
              className={cn(
                "p-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2",
                favorited ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
              onClick={handleFavoriteClick}
            >
              <Heart className={cn("w-5 h-5", favorited && "fill-current")} />
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
            <span>{listing.location.city} • {listing.distance} {t('common.miAway')}</span>
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
        listing.isSponsored && "ring-2 ring-warning shadow-orange",
        className
      )}
      style={style}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className={cn("w-full h-full object-cover transition-transform duration-500 group-hover:scale-105", listing.status !== 'active' && "opacity-60")}
        />
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg">{t('listing.sold')}</span>
          </div>
        )}
        {listing.status === 'draft' && (
          <span className="absolute top-3 left-3 bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded">
            {t('listing.draft')}
          </span>
        )}
        {listing.status === 'expired' && (
          <span className="absolute top-3 left-3 bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
            {t('listing.expired')}
          </span>
        )}
        {listing.status === 'active' && listing.isSponsored && (
          <span className="absolute top-3 left-3 carnexo-badge-sponsored flex items-center gap-1">
            <Megaphone className="w-3 h-3" />
            {t('listing.sponsored')}
          </span>
        )}
        {listing.status === 'active' && listing.isPremium && !listing.isSponsored && (
          <span className="absolute top-3 left-3 carnexo-badge-premium">
            {t('listing.premium')}
          </span>
        )}
        {listing.status === 'active' && listing.type === 'service' && !listing.isPremium && !listing.isSponsored && (
          <span className="absolute top-3 left-3 carnexo-badge-service">
            {t('listing.service')}
          </span>
        )}
        <button 
          className={cn(
            "absolute top-3 right-3 p-2.5 rounded-full bg-background/20 backdrop-blur-sm transition-all touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center",
            favorited ? "text-primary" : "text-foreground hover:bg-background/40"
          )}
          onClick={handleFavoriteClick}
        >
          <Heart className={cn("w-5 h-5", favorited && "fill-current")} />
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
              <span>{Math.round(listing.vehicleAttributes.mileage / 1000)}k {t('common.mi')}</span>
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
            <span>{listing.distance} {t('common.mi')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}