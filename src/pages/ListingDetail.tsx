import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Gauge, 
  Settings, 
  Fuel, 
  Car,
  Phone,
  MessageSquare,
  MapPin,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerCard } from '@/components/SellerCard';
import { mockListings, mockReviews } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const listing = mockListings.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Listing not found</p>
      </div>
    );
  }

  const specs = listing.vehicleAttributes ? [
    { icon: Gauge, label: `${Math.round(listing.vehicleAttributes.mileage / 1000)}k km`, value: 'Mileage' },
    { icon: Settings, label: listing.vehicleAttributes.transmission, value: 'Transmission' },
    { icon: Fuel, label: listing.vehicleAttributes.fuelType, value: 'Fuel' },
    { icon: Car, label: listing.vehicleAttributes.bodyType || 'Sedan', value: 'Body' },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Image Gallery */}
      <div className="relative">
        <div className="aspect-[4/3] bg-muted">
          <img
            src={listing.images[activeImage]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between safe-top">
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "bg-background/20 backdrop-blur-sm hover:bg-background/40",
                isFavorite && "text-primary"
              )}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </Button>
          </div>
        </div>

        {/* Image indicators */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listing.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === activeImage 
                    ? "bg-primary w-4" 
                    : "bg-foreground/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-6 animate-fade-in">
        {/* Price & Title */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl font-bold text-primary">
              ${listing.price.toLocaleString()}
            </span>
            {listing.owner?.isVerified && (
              <span className="carnexo-badge-verified flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            )}
            {listing.isNegotiable && (
              <span className="carnexo-badge-negotiable">Negotiable</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground">{listing.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{listing.location.city}, {listing.location.state}</span>
            <span>•</span>
            <span>2 hours ago</span>
          </div>
        </div>

        {/* Quick Specs */}
        {specs.length > 0 && (
          <div className="grid grid-cols-4 gap-3 p-4 bg-card rounded-2xl">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <spec.icon className="w-5 h-5 text-muted-foreground mb-2" />
                <span className="text-xs text-foreground font-medium capitalize">
                  {spec.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Description</h2>
          <p className="text-muted-foreground leading-relaxed">
            {listing.description}
            <button className="text-primary font-medium ml-1">Read more</button>
          </p>
        </div>

        {/* Features */}
        {listing.features && listing.features.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Features</h2>
            <div className="flex flex-wrap gap-2">
              {listing.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-muted rounded-lg text-sm text-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Location</h2>
            <button className="text-sm text-primary font-medium flex items-center gap-1">
              View on map
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="relative h-40 rounded-2xl overflow-hidden">
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6a00(${listing.location.lng},${listing.location.lat})/${listing.location.lng},${listing.location.lat},13,0/800x400@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHJwOWhtYmkwMjR1MmpwZnFuZnk5ZmdhIn0.9Wxs0c6BcEPauFsj_TxmPA`}
              alt="Location map"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-medium">
              {listing.location.city}, {listing.location.state}
            </div>
          </div>
        </div>

        {/* Seller */}
        {listing.owner && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">Seller</h2>
            <SellerCard seller={listing.owner} />
          </div>
        )}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button variant="call" size="lg" className="flex-1">
            <Phone className="w-5 h-5 mr-2" />
            Call
          </Button>
          <Button variant="contact" size="lg" className="flex-[2]">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contact
          </Button>
        </div>
      </div>
    </div>
  );
}
