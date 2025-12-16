import { Star, MapPin, Clock, Phone, Navigation, ExternalLink, ChevronRight, X, Car, Wrench, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MapBusinessCardProps {
  listing: Listing;
  travelTime?: { driving: string; walking: string; distance: string };
  onClose: () => void;
  onGetDirections: () => void;
  onViewDetails: () => void;
}

export function MapBusinessCard({ 
  listing, 
  travelTime,
  onClose, 
  onGetDirections,
  onViewDetails 
}: MapBusinessCardProps) {
  const { t } = useTranslation();
  
  const getTypeIcon = () => {
    switch (listing.type) {
      case 'vehicle': return <Car className="w-4 h-4" />;
      case 'part': return <Settings className="w-4 h-4" />;
      case 'service': return <Wrench className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (listing.type) {
      case 'vehicle': return t('map.listingTypes.vehicle');
      case 'part': return t('map.listingTypes.part');
      case 'service': return t('map.listingTypes.service');
    }
  };

  const openInMaps = () => {
    const { lat, lng } = listing.location;
    const label = encodeURIComponent(listing.title);
    
    // Try Google Maps first, fallback to Apple Maps
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open(`maps://maps.google.com/maps?daddr=${lat},${lng}&amp;ll=`);
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`, '_blank');
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-elevated overflow-hidden animate-fade-in">
      {/* Header Image Gallery */}
      <div className="relative h-40 overflow-hidden">
        <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory h-full">
          {listing.images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${listing.title} - ${index + 1}`}
              className="w-full h-full object-cover snap-center flex-shrink-0"
            />
          ))}
        </div>
        <div className="absolute top-2 right-2 flex gap-2">
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
        {listing.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {listing.images.map((_, index) => (
              <div 
                key={index} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  index === 0 ? "bg-primary" : "bg-foreground/30"
                )} 
              />
            ))}
          </div>
        )}
        {listing.isPremium && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            PREMIUM
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Type & Rating */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="flex items-center gap-1">
            {getTypeIcon()}
            {getTypeLabel()}
          </Badge>
          {listing.owner && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="font-medium text-foreground">{listing.owner.ratingAvg}</span>
              <span className="text-muted-foreground">({t('map.reviews', { count: listing.owner.totalReviews })})</span>
            </div>
          )}
        </div>

        {/* Title & Price */}
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-1">{listing.title}</h3>
          <p className="text-primary font-bold text-xl mt-0.5">
            {listing.type === 'service' && listing.serviceAttributes?.priceStructure === 'Starting from' && 'From '}
            ${listing.price.toLocaleString()}
            {listing.serviceAttributes?.priceStructure === 'Hourly rate' && '/hr'}
          </p>
        </div>

        {/* Location & Travel Time */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{listing.location.city}, {listing.location.state}</span>
          </div>
          {travelTime && (
            <div className="flex items-center gap-1 text-primary font-medium">
              <Clock className="w-4 h-4" />
              <span>{travelTime.driving} {t('map.drive')}</span>
            </div>
          )}
        </div>

        {/* Distance Badge */}
        {travelTime && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              <Car className="w-3 h-3 mr-1" /> {travelTime.driving}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {travelTime.distance}
            </Badge>
          </div>
        )}

        {/* Service Availability */}
        {listing.serviceAttributes?.availability && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-success" />
            <span className="text-success font-medium">{t('map.open')}</span>
            <span className="text-muted-foreground">• {listing.serviceAttributes.availability[0]}</span>
          </div>
        )}

        {/* Owner Info */}
        {listing.owner && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <img 
              src={listing.owner.avatarUrl} 
              alt={listing.owner.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{listing.owner.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {listing.owner.isVerified && (
                  <span className="text-success">✓ {t('map.verified')}</span>
                )}
                <span>{t('map.memberSince', { date: listing.owner.memberSince })}</span>
              </div>
            </div>
            {listing.owner.phone && (
              <a 
                href={`tel:${listing.owner.phone}`}
                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            onClick={openInMaps}
          >
            <Navigation className="w-4 h-4 mr-2" />
            {t('map.directions')}
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={onViewDetails}
          >
            {t('map.viewDetails')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
