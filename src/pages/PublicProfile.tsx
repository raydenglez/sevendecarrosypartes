import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import { 
  MapPin, 
  Star, 
  Calendar,
  ArrowLeft,
  Car,
  Wrench,
  Settings2,
  Loader2,
  MessageCircle,
  Share2,
  Heart,
  Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';

interface PublicProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  location_city: string | null;
  location_state: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  user_type: string | null;
}

interface Listing {
  id: string;
  title: string;
  price: number | null;
  images: string[] | null;
  location_city: string | null;
  location_state: string | null;
  type: string;
  is_premium: boolean | null;
  is_sponsored: boolean | null;
}

// Simple listing card for public profile
function SimpleListingCard({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavoritesContext();
  const favorited = isFavorite(listing.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  return (
    <Link
      to={`/listing/${listing.id}`}
      className={cn(
        "block bg-card rounded-xl overflow-hidden transition-all duration-200 hover:bg-card-elevated",
        listing.is_sponsored && "ring-2 ring-warning shadow-orange"
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={listing.images?.[0] || '/placeholder.svg'}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
        {listing.is_sponsored && (
          <span className="absolute top-2 left-2 carnexo-badge-sponsored text-[10px] px-1.5 py-0.5 flex items-center gap-1">
            <Megaphone className="w-3 h-3" />
            {t('listing.sponsored')}
          </span>
        )}
        {listing.is_premium && !listing.is_sponsored && (
          <span className="absolute top-2 left-2 carnexo-badge-premium text-[10px] px-1.5 py-0.5">
            {t('listing.premium')}
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
          ${(listing.price || 0).toLocaleString()}
        </p>
        <h3 className="font-medium text-foreground text-sm truncate mt-0.5">{listing.title}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
          <MapPin className="w-3 h-3" />
          <span>{listing.location_city || 'Unknown'}{listing.location_state ? `, ${listing.location_state}` : ''}</span>
        </div>
      </div>
    </Link>
  );
}

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Remove @ prefix if present
  const cleanUsername = username?.startsWith('@') ? username.slice(1) : username;

  useEffect(() => {
    async function fetchProfile() {
      if (!cleanUsername) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Fetch profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('public_profiles')
          .select('*')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (profileError || !profileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(profileData as PublicProfileData);

        // Fetch user's active listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, title, price, images, location_city, location_state, type, is_premium, is_sponsored')
          .eq('owner_id', profileData.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(12);

        setListings(listingsData || []);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [cleanUsername]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/@${cleanUsername}`;
    const shareData = {
      title: profile?.full_name || cleanUsername || 'Profile',
      text: `Check out ${profile?.full_name || cleanUsername}'s profile on CarNetworx`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t('common.copied'),
          description: t('common.linkCopied'),
        });
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t('common.copied'),
          description: t('common.linkCopied'),
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">{t('nav.profile')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('profile.notFound')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('profile.notFoundDesc')}
          </p>
          <Button variant="carnetworx" onClick={() => navigate('/')}>
            {t('common.goHome')}
          </Button>
        </div>
      </div>
    );
  }

  const memberSince = profile.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const vehicleCount = listings.filter(l => l.type === 'vehicle').length;
  const partsCount = listings.filter(l => l.type === 'part').length;
  const servicesCount = listings.filter(l => l.type === 'service').length;

  return (
    <>
      <SEO 
        titleKey="seo.publicProfile.title"
        descriptionKey="seo.publicProfile.description"
        path={`/profile/@${cleanUsername}`}
      />
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl pt-[calc(env(safe-area-inset-top)+12px)] border-b border-border">
          <div className="px-4 pt-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">@{cleanUsername}</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Profile Info */}
        <div className="flex flex-col items-center px-4 py-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="w-24 h-24 rounded-full object-cover border-4 border-card"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-orange border-4 border-card flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          
          <h2 className="text-xl font-bold text-foreground mt-4">{profile.full_name || 'User'}</h2>
          
          {profile.location_city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ''}</span>
            </div>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span className="font-medium text-foreground">
                {(profile.rating_avg || 0).toFixed(1)}
              </span>
              <span className="text-muted-foreground">
                ({profile.rating_count || 0})
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{memberSince}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            {vehicleCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Car className="w-4 h-4 text-primary" />
                <span className="font-medium">{vehicleCount}</span>
                <span className="text-muted-foreground">{t('profile.vehicles')}</span>
              </div>
            )}
            {partsCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Wrench className="w-4 h-4 text-secondary" />
                <span className="font-medium">{partsCount}</span>
                <span className="text-muted-foreground">{t('profile.parts')}</span>
              </div>
            )}
            {servicesCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Settings2 className="w-4 h-4 text-success" />
                <span className="font-medium">{servicesCount}</span>
                <span className="text-muted-foreground">{t('profile.services')}</span>
              </div>
            )}
          </div>

          {/* Contact Button */}
          <Button 
            variant="carnetworx" 
            className="mt-4"
            onClick={() => navigate(`/seller/${profile.id}`)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('listing.contactSeller')}
          </Button>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <section className="px-4 mt-4">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('profile.listings')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => (
                <SimpleListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {listings.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-muted-foreground">{t('profile.noListings')}</p>
          </div>
        )}
      </div>
    </>
  );
}
