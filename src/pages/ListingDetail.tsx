import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import { 
  ArrowLeft, 
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
  Trash2,
  Flag,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerCard } from '@/components/SellerCard';
import { ShareButton } from '@/components/ShareButton';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { getOrCreateConversation } from '@/hooks/useConversations';
import { useToast } from '@/hooks/use-toast';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewsList, type Review } from '@/components/ReviewsList';
import { useReviewEligibility } from '@/hooks/useReviewEligibility';
import { ReportModal } from '@/components/ReportModal';
import { Map as MapComponent } from '@/components/Map';
import useEmblaCarousel from 'embla-carousel-react';
import type { Listing, User } from '@/types';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [galleryEmblaRef, galleryEmblaApi] = useEmblaCarousel({ loop: true, startIndex: galleryIndex });

  // Sync carousel index with activeImage state
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveImage(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  // Sync gallery carousel with galleryIndex
  useEffect(() => {
    if (galleryEmblaApi && showGallery) {
      galleryEmblaApi.scrollTo(galleryIndex, true);
    }
  }, [galleryEmblaApi, galleryIndex, showGallery]);

  // Update gallery index on scroll
  useEffect(() => {
    if (!galleryEmblaApi) return;
    const onSelect = () => setGalleryIndex(galleryEmblaApi.selectedScrollSnap());
    galleryEmblaApi.on('select', onSelect);
    return () => { galleryEmblaApi.off('select', onSelect); };
  }, [galleryEmblaApi]);

  const eligibility = useReviewEligibility(id || '', listing?.ownerId || '');

  const fetchReviews = useCallback(async () => {
    if (!id) return;
    setReviewsLoading(true);
    
    // Fetch reviews without profile join (RLS blocks profiles access)
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        communication_rating,
        accuracy_rating,
        service_rating,
        comment,
        created_at,
        reviewer_id
      `)
      .eq('listing_id', id)
      .order('created_at', { ascending: false });

    if (error || !reviewsData) {
      console.error('Error fetching reviews:', error);
      setReviewsLoading(false);
      return;
    }

    // Get unique reviewer IDs and fetch from public_profiles view
    const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
    
    const { data: reviewerProfiles } = await supabase
      .from('public_profiles')
      .select('id, full_name, avatar_url')
      .in('id', reviewerIds);

    // Create a map for quick lookup
    const reviewerMap = new Map(
      reviewerProfiles?.map(p => [p.id, p]) || []
    );

    const transformedReviews: Review[] = reviewsData.map((r) => {
      const reviewer = reviewerMap.get(r.reviewer_id);
      return {
        id: r.id,
        rating: r.rating,
        communication_rating: r.communication_rating,
        accuracy_rating: r.accuracy_rating,
        service_rating: r.service_rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer: reviewer ? {
          id: reviewer.id || '',
          full_name: reviewer.full_name,
          avatar_url: reviewer.avatar_url
        } : null
      };
    });
    setReviews(transformedReviews);
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
        title: t('listing.cannotMessage'),
        description: t('listing.cannotMessageSelf'),
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
        title: t('toast.error'),
        description: t('listing.conversationError'),
        variant: "destructive",
      });
    }
    setContactLoading(false);
  };

  useEffect(() => {
    async function fetchListing() {
      if (!id) return;
      
      setLoading(true);
      const { data } = await supabase
        .from('listings')
        .select(`
          *,
          vehicle_attributes (*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (data) {
        // Fetch owner profile from public_profiles view (excludes sensitive data)
        const { data: ownerProfile } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url, rating_avg, rating_count, is_verified, user_type, location_city, location_state')
          .eq('id', data.owner_id)
          .single();

        const owner: User | undefined = ownerProfile ? {
          id: ownerProfile.id,
          name: ownerProfile.full_name || '',
          email: '',
          location: {
            lat: 0,
            lng: 0,
            city: ownerProfile.location_city || '',
            state: ownerProfile.location_state || ''
          },
          avatarUrl: ownerProfile.avatar_url || undefined,
          type: ownerProfile.user_type === 'dealer' ? 'pro_seller' : 
                ownerProfile.user_type === 'service_provider' ? 'service_provider' : 'user',
          ratingAvg: Number(ownerProfile.rating_avg) || 0,
          totalReviews: ownerProfile.rating_count || 0,
          memberSince: '',
          isVerified: ownerProfile.is_verified || false,
          badges: []
        } : undefined;

        // Only include VIN if current user is the owner
        const isOwner = user?.id === data.owner_id;

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
            vin: isOwner ? (data.vehicle_attributes.vin || undefined) : undefined
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
        <p className="text-muted-foreground">{t('listing.notFound')}</p>
      </div>
    );
  }

  const specs = listing.vehicleAttributes ? [
    { icon: Gauge, label: `${Math.round(listing.vehicleAttributes.mileage / 1000)}k km`, value: t('listing.specs.mileage') },
    { icon: Settings, label: listing.vehicleAttributes.transmission, value: t('listing.specs.transmission') },
    { icon: Fuel, label: listing.vehicleAttributes.fuelType, value: t('listing.specs.fuel') },
    { icon: Car, label: listing.vehicleAttributes.bodyType || 'Sedan', value: t('listing.specs.body') },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Image Gallery with Embla Carousel */}
      <div className="relative">
        <div className="aspect-[4/3] bg-muted overflow-hidden" ref={emblaRef}>
          <div className="flex h-full">
            {listing.images.map((img, idx) => (
              <div 
                key={idx} 
                className="flex-[0_0_100%] min-w-0 cursor-pointer"
                onClick={() => {
                  setGalleryIndex(idx);
                  setShowGallery(true);
                }}
              >
                <img
                  src={img}
                  alt={`${listing.title} - ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
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
            <ShareButton
              title={listing.title}
              text={`Check out ${listing.title} on CarNexo - $${listing.price.toLocaleString()}`}
              className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
            />
            {user && listing.ownerId !== user.id && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-background/20 backdrop-blur-sm hover:bg-background/40"
                  onClick={() => setShowReportModal(true)}
                >
                  <Flag className="w-5 h-5" />
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
              </>
            )}
          </div>
        </div>

        {/* Report Modal */}
        {listing && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            listingId={listing.id}
            listingTitle={listing.title}
          />
        )}

        {/* Image indicators */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listing.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
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
                {t('listing.sold')}
              </span>
            )}
            {listing.status === 'draft' && (
              <span className="bg-yellow-500 text-yellow-950 text-xs font-bold px-2 py-1 rounded">
                {t('listing.draft')}
              </span>
            )}
            {listing.status === 'expired' && (
              <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded">
                {t('listing.expired')}
              </span>
            )}
            {listing.owner?.isVerified && (
              <span className="carnexo-badge-verified flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {t('listing.verified')}
              </span>
            )}
            {listing.isNegotiable && (
              <span className="carnexo-badge-negotiable">{t('listing.negotiable')}</span>
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
          <h2 className="text-lg font-bold text-foreground mb-3">{t('listing.description')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {listing.description}
            <button className="text-primary font-medium ml-1">{t('listing.readMore')}</button>
          </p>
        </div>

        {/* Features */}
        {listing.features && listing.features.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">{t('listing.features')}</h2>
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
            <h2 className="text-lg font-bold text-foreground">{t('listing.location')}</h2>
            {listing.location.lat !== 0 && listing.location.lng !== 0 && (
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${listing.location.lat},${listing.location.lng}`, '_blank')}
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                {t('listing.viewOnMap')}
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
          {listing.location.lat !== 0 && listing.location.lng !== 0 ? (
            <div className="relative h-48 rounded-2xl overflow-hidden group">
              <MapComponent
                center={[listing.location.lng, listing.location.lat]}
                zoom={14}
                className="h-48"
                listings={[listing]}
              />
              <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-background/90 backdrop-blur-sm rounded-lg text-sm font-medium flex items-center gap-2 pointer-events-none">
                <MapPin className="w-4 h-4 text-primary" />
                {listing.location.city}, {listing.location.state}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm hover:bg-background/90 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowFullscreenMap(true)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="relative h-48 rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{listing.location.city}, {listing.location.state}</p>
              </div>
            </div>
          )}
        </div>

        {/* Seller */}
        {listing.owner && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-3">{t('listing.seller')}</h2>
            <SellerCard seller={listing.owner} />
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <h2 className="text-lg font-bold text-foreground">{t('reviews.title')}</h2>
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

      {/* Fullscreen Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center" ref={galleryEmblaRef}>
            <div className="flex h-full w-full">
              {listing.images.map((img, idx) => (
                <div key={idx} className="flex-[0_0_100%] min-w-0 flex items-center justify-center p-4">
                  <img
                    src={img}
                    alt={`${listing.title} - ${idx + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between safe-top">
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
              onClick={() => setShowGallery(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <span className="text-white/80 text-sm font-medium">
              {galleryIndex + 1} / {listing.images.length}
            </span>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Navigation Arrows */}
          {listing.images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                onClick={() => galleryEmblaApi?.scrollPrev()}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                onClick={() => galleryEmblaApi?.scrollNext()}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Thumbnail indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 safe-bottom">
            {listing.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => galleryEmblaApi?.scrollTo(idx)}
                className={cn(
                  "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                  idx === galleryIndex 
                    ? "border-white opacity-100" 
                    : "border-transparent opacity-50 hover:opacity-75"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Map Modal */}
      {showFullscreenMap && listing.location.lat !== 0 && listing.location.lng !== 0 && (
        <div className="fixed inset-0 z-50 bg-background animate-fade-in">
          <div className="absolute inset-0">
            <MapComponent
              center={[listing.location.lng, listing.location.lat]}
              zoom={15}
              className="h-full"
              listings={[listing]}
            />
          </div>
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between safe-top">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={() => setShowFullscreenMap(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            <div className="px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg">
              <h3 className="font-semibold text-sm">{listing.title}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.location.city}, {listing.location.state}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${listing.location.lat},${listing.location.lng}`, '_blank')}
            >
              <ExternalLink className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

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
              {t('listing.editListing')}
            </Button>
          ) : (
            <>
              <Button variant="call" size="lg" className="flex-1">
                <Phone className="w-5 h-5 mr-2" />
                {t('listing.call')}
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
                {t('listing.contact')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
