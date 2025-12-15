import { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  Loader2,
  Star,
  Pencil,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerCard } from '@/components/SellerCard';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { useToast } from '@/hooks/use-toast';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList, type Review } from '@/components/ReviewsList';
import { useReviewEligibility } from '@/hooks/useReviewEligibility';
import type { Listing, User } from '@/types';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const eligibility = useReviewEligibility(id || '', listing?.ownerId || '');

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        communication_rating,
        accuracy_rating,
        service_rating,
        comment,
        created_at,
        profiles:reviewer_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq('listing_id', id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const transformedReviews: Review[] = data.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        communication_rating: r.communication_rating,
        accuracy_rating: r.accuracy_rating,
        service_rating: r.service_rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer: r.profiles ? {
          id: r.profiles.id,
          full_name: r.profiles.full_name,
          avatar_url: r.profiles.avatar_url
        } : null
      }));
      setReviews(transformedReviews);
    }
    setReviewsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleContact = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!listing || listing.ownerId === user.id) {
      toast({
        title: "Cannot message",
        description: "You cannot message yourself",
        variant: "destructive",
      });
      return;
    }

    setContactLoading(true);
    const conversationId = await getOrCreateConversation(
      listing.id,
      listing.ownerId,
      user.id
    );

    if (conversationId) {
      navigate(`/chat/${conversationId}`);
    } else {
      toast({
        title: "Error",
        description: "Could not start conversation. Please try again.",
        variant: "destructive",
      });
    }
    setContactLoading(false);
  };

  useEffect(() => {
    async function fetchListing() {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:owner_id (
            id,
            full_name,
            avatar_url,
            rating_avg,
            rating_count,
            is_verified,
            user_type,
            location_city,
            location_state
          ),
          vehicle_attributes (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (data) {
        const owner: User | undefined = data.profiles ? {
          id: data.profiles.id,
          name: data.profiles.full_name || 'Unknown',
          email: '',
          location: {
            lat: 0,
            lng: 0,
            city: data.profiles.location_city || '',
            state: data.profiles.location_state || ''
          },
          avatarUrl: data.profiles.avatar_url || undefined,
          type: data.profiles.user_type === 'dealer' ? 'pro_seller' : 
                data.profiles.user_type === 'service_provider' ? 'service_provider' : 'user',
          ratingAvg: Number(data.profiles.rating_avg) || 0,
          totalReviews: data.profiles.rating_count || 0,
          memberSince: '',
          isVerified: data.profiles.is_verified || false,
          badges: []
        } : undefined;

        const transformedListing: Listing = {
          id: data.id,
          ownerId: data.owner_id,
          owner,
          type: data.type,
          status: data.status || 'active',
          title: data.title,
          description: data.description || '',
          price: Number(data.price) || 0,
          location: {
            lat: Number(data.location_lat) || 0,
            lng: Number(data.location_lng) || 0,
            city: data.location_city || '',
            state: data.location_state || ''
          },
          images: data.images || ['/placeholder.svg'],
          isPremium: data.is_premium || false,
          isNegotiable: data.is_negotiable || false,
          createdAt: data.created_at || '',
          updatedAt: data.updated_at || '',
          vehicleAttributes: data.vehicle_attributes ? {
            make: data.vehicle_attributes.make || '',
            model: data.vehicle_attributes.model || '',
            year: data.vehicle_attributes.year || 0,
            mileage: data.vehicle_attributes.mileage || 0,
            fuelType: data.vehicle_attributes.fuel_type as any || 'gasoline',
            transmission: data.vehicle_attributes.transmission as any || 'automatic',
            color: data.vehicle_attributes.color || undefined,
            vin: data.vehicle_attributes.vin || undefined
          } : undefined
        };
        setListing(transformedListing);
      }
      setLoading(false);
    }

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            {user && listing.ownerId === user.id && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
                onClick={() => navigate(`/listing/${id}/edit`)}
              >
                <Pencil className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            {user && listing.ownerId !== user.id && (
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
            )}
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
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="text-3xl font-bold text-primary">
              ${listing.price.toLocaleString()}
            </span>
            {listing.status === 'sold' && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">
                SOLD
              </span>
            )}
            {listing.status === 'draft' && (
              <span className="bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded">
                DRAFT
              </span>
            )}
            {listing.status === 'expired' && (
              <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
                EXPIRED
              </span>
            )}
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

        {/* Reviews Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <h2 className="text-lg font-bold text-foreground">Reviews</h2>
            {reviews.length > 0 && (
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            )}
          </div>

          {/* Review Form */}
          {!eligibility.loading && (
            <div className="mb-6">
              <ReviewForm
                listingId={listing.id}
                onSuccess={fetchReviews}
                eligibility={eligibility}
              />
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ReviewsList
              reviews={reviews}
              averageRating={reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0}
              totalReviews={reviews.length}
            />
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {user && listing.ownerId === user.id ? (
            <Button 
              variant="carnexo" 
              size="lg" 
              className="flex-1"
              onClick={() => navigate(`/listing/${id}/edit`)}
            >
              <Pencil className="w-5 h-5 mr-2" />
              Edit Listing
            </Button>
          ) : (
            <>
              <Button variant="call" size="lg" className="flex-1">
                <Phone className="w-5 h-5 mr-2" />
                Call
              </Button>
              <Button 
                variant="contact" 
                size="lg" 
                className="flex-[2]"
                onClick={handleContact}
                disabled={contactLoading}
              >
                {contactLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="w-5 h-5 mr-2" />
                )}
                Contact
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
