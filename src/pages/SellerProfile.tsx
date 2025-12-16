import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import { 
  ArrowLeft, 
  Star, 
  CheckCircle, 
  MapPin, 
  Calendar,
  MessageSquare,
  Loader2,
  Car,
  Wrench,
  Settings,
  Share2,
  Check,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ListingCard } from '@/components/ListingCard';
import { BottomNav } from '@/components/BottomNav';
import { ReviewsList } from '@/components/ReviewsList';
import type { Listing, User } from '@/types';

interface Review {
  id: string;
  rating: number;
  communication_rating: number | null;
  accuracy_rating: number | null;
  service_rating: number | null;
  comment: string | null;
  created_at: string;
  reviewer: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export default function SellerProfile() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${seller?.name} on CarNexo`,
      text: `Check out ${seller?.name}'s profile on CarNexo - ${seller?.ratingAvg.toFixed(1)}★ rated seller`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success(t('sellerProfile.linkCopied'));
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success(t('sellerProfile.linkCopied'));
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  useEffect(() => {
    async function fetchSellerData() {
      if (!id) return;
      
      setLoading(true);
      
      // Fetch seller profile from public_profiles view (excludes sensitive data like email/phone)
      const { data: profileData } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileData) {
        const transformedSeller: User = {
          id: profileData.id,
          name: profileData.full_name || 'Unknown',
          email: '', // Not exposed in public view
          phone: undefined, // Not exposed in public view
          location: {
            lat: 0,
            lng: 0,
            city: profileData.location_city || '',
            state: profileData.location_state || ''
          },
          avatarUrl: profileData.avatar_url || undefined,
          type: profileData.user_type === 'dealer' ? 'pro_seller' : 
                profileData.user_type === 'service_provider' ? 'service_provider' : 'user',
          ratingAvg: Number(profileData.rating_avg) || 0,
          totalReviews: profileData.rating_count || 0,
          memberSince: new Date(profileData.created_at).toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          }),
          isVerified: profileData.is_verified || false,
          badges: []
        };

        // Add badges based on rating
        if (transformedSeller.ratingAvg >= 4.7 && transformedSeller.totalReviews >= 10) {
          transformedSeller.badges.push('Top Rated');
        }
        if (transformedSeller.isVerified) {
          transformedSeller.badges.push('Verified');
        }

        setSeller(transformedSeller);
      }

      // Fetch seller's listings with public vehicle attributes (excludes VIN)
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', id)
        .eq('status', 'active');

      if (listingsData) {
        // Fetch public vehicle attributes separately (excludes VIN)
        const vehicleListingIds = listingsData.filter(l => l.type === 'vehicle').map(l => l.id);
        const { data: vehicleAttrs } = vehicleListingIds.length > 0 
          ? await supabase
              .from('public_vehicle_attributes')
              .select('*')
              .in('listing_id', vehicleListingIds)
          : { data: [] as any[] };

        const vehicleAttrsMap = new Map<string, any>((vehicleAttrs || []).map(v => [v.listing_id, v] as [string, any]));

        const transformedListings: Listing[] = listingsData.map(data => {
          const vehicleAttr = vehicleAttrsMap.get(data.id);
          return {
            id: data.id,
            ownerId: data.owner_id,
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
            vehicleAttributes: vehicleAttr ? {
              make: vehicleAttr.make || '',
              model: vehicleAttr.model || '',
              year: vehicleAttr.year || 0,
              mileage: vehicleAttr.mileage || 0,
              fuelType: vehicleAttr.fuel_type as any || 'gasoline',
              transmission: vehicleAttr.transmission as any || 'automatic',
              color: vehicleAttr.color || undefined,
              vin: undefined // VIN excluded from public view
            } : undefined
          };
        });
        setListings(transformedListings);
      }

      // Fetch reviews for seller's listings
      const { data: reviewsData } = await supabase
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
        .in('listing_id', listingsData?.map(l => l.id) || [])
        .order('created_at', { ascending: false });

      if (reviewsData && reviewsData.length > 0) {
        // Fetch reviewer profiles separately from public_profiles view
        const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
        const { data: reviewerProfiles } = await supabase
          .from('public_profiles')
          .select('id, full_name, avatar_url')
          .in('id', reviewerIds);

        const reviewerMap = new Map(reviewerProfiles?.map(p => [p.id, p]) || []);
        
        const reviewsWithReviewers = reviewsData.map(r => ({
          ...r,
          reviewer: reviewerMap.get(r.reviewer_id) || { full_name: 'Unknown', avatar_url: null }
        }));
        
        setReviews(reviewsWithReviewers as any);
      }

      setLoading(false);
    }

    fetchSellerData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-foreground mb-2">{t('sellerProfile.notFound')}</h1>
        <p className="text-muted-foreground mb-6">{t('sellerProfile.notFoundDesc')}</p>
        <Button onClick={() => navigate(-1)}>{t('common.goBack')}</Button>
      </div>
    );
  }

  const vehicleListings = listings.filter(l => l.type === 'vehicle');
  const partListings = listings.filter(l => l.type === 'part');
  const serviceListings = listings.filter(l => l.type === 'service');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-foreground">{t('sellerProfile.title')}</h1>
          <button 
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            {copied ? (
              <Check className="w-5 h-5 text-success" />
            ) : (
              <Share2 className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative">
            {seller.avatarUrl ? (
              <img
                src={seller.avatarUrl}
                alt={seller.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <span className="text-2xl font-bold text-secondary-foreground">
                  {seller.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            {seller.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-success flex items-center justify-center border-2 border-background">
                <CheckCircle className="w-4 h-4 text-success-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{seller.name}</h2>
              {seller.type === 'pro_seller' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-secondary text-secondary-foreground">
                  Pro Seller
                </span>
              )}
              {seller.type === 'service_provider' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-primary/10 text-primary">
                  Service Provider
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="font-medium text-foreground">{seller.ratingAvg.toFixed(1)}</span>
              <span className="text-muted-foreground">({seller.totalReviews} reviews)</span>
            </div>

            {(seller.location.city || seller.location.state) && (
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  {[seller.location.city, seller.location.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Member since {seller.memberSince}</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        {seller.badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {seller.badges.map((badge, index) => (
              <span 
                key={index}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full",
                  badge === 'Top Rated' && "bg-warning/10 text-warning",
                  badge === 'Verified' && "bg-success/10 text-success"
                )}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Contact Buttons */}
        <div className="flex gap-3 mt-6">
          <Button className="flex-1 gap-2" variant="default">
            <MessageSquare className="w-4 h-4" />
            Message
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-y border-border bg-card/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{listings.length}</p>
          <p className="text-xs text-muted-foreground">Active Listings</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{seller.ratingAvg.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{seller.totalReviews}</p>
          <p className="text-xs text-muted-foreground">Reviews</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full justify-start px-6 bg-transparent border-b border-border rounded-none h-auto p-0">
          <TabsTrigger 
            value="listings" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Listings ({listings.length})
          </TabsTrigger>
          <TabsTrigger 
            value="reviews"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            Reviews ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-0 p-6">
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No active listings</p>
            </div>
          ) : (
            <div className="space-y-6">
              {vehicleListings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Vehicles ({vehicleListings.length})</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {vehicleListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </div>
              )}

              {partListings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Parts ({partListings.length})</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {partListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </div>
              )}

              {serviceListings.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Services ({serviceListings.length})</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {serviceListings.map(listing => (
                      <ListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-0 p-6">
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No reviews yet</p>
            </div>
          ) : (
            <ReviewsList
              reviews={reviews.map(r => ({
                id: r.id,
                rating: r.rating,
                communication_rating: r.communication_rating,
                accuracy_rating: r.accuracy_rating,
                service_rating: r.service_rating,
                comment: r.comment,
                created_at: r.created_at,
                reviewer: r.reviewer ? {
                  id: '',
                  full_name: r.reviewer.full_name,
                  avatar_url: r.reviewer.avatar_url
                } : null
              }))}
              averageRating={seller.ratingAvg}
              totalReviews={seller.totalReviews}
            />
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}
