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
  MessageSquare,
  Share2,
  Heart,
  Megaphone,
  BadgeCheck,
  Users,
  ExternalLink,
  Instagram,
  Globe,
  Phone,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { BusinessCategoryBadge } from '@/components/BusinessCategorySelect';
import { UserBadgesDisplay } from '@/components/UserBadgesDisplay';

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
  business_category: string | null;
  bio: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
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
    const displayName = profile?.full_name || cleanUsername || 'this seller';
    const shareData = {
      title: `${displayName} on CarNetworx`,
      text: `🚗 Check out ${displayName}'s profile on CarNetworx! Browse their vehicles, parts & services. Connect with trusted sellers in your area.`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n\n${shareUrl}`);
        toast({
          title: t('common.copied'),
          description: t('common.linkCopied'),
        });
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(`${shareData.text}\n\n${shareUrl}`);
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

  const profileTitle = `${profile.full_name || cleanUsername} (@${cleanUsername}) | CarNetworx`;
  const profileDescription = profile.location_city 
    ? `${t('profile.viewProfile', { name: profile.full_name || cleanUsername })} - ${profile.location_city}${profile.location_state ? `, ${profile.location_state}` : ''}. ${listings.length} ${t('profile.activeListings')}.`
    : `${t('profile.viewProfile', { name: profile.full_name || cleanUsername })}. ${listings.length} ${t('profile.activeListings')}.`;

  return (
    <>
      <SEO 
        title={profileTitle}
        description={profileDescription}
        path={`/profile/@${cleanUsername}`}
        image={profile.avatar_url || '/pwa-192x192.png'}
        type="profile"
      />
      <div className="min-h-screen bg-background pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl pt-[calc(env(safe-area-inset-top)+12px)] border-b border-border">
          <div className="px-4 pt-4 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Profile</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <ExternalLink className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Hero Profile Section */}
        <div className="relative">
          {/* Gradient Background */}
          <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          
          {/* Profile Card */}
          <div className="relative px-4 -mt-16">
            <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
              {/* Avatar & Verification */}
              <div className="flex flex-col items-center -mt-16">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-28 h-28 rounded-full object-cover border-4 border-card shadow-xl"
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gradient-orange border-4 border-card shadow-xl flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary-foreground">
                        {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  {profile.is_verified && (
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 shadow-lg">
                      <BadgeCheck className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Name & Username */}
                <h2 className="text-2xl font-bold text-foreground mt-4">{profile.full_name || 'User'}</h2>
                <p className="text-muted-foreground text-sm">@{cleanUsername}</p>
                
                {/* Verified Badge */}
                {profile.is_verified && (
                  <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-primary/10 rounded-full">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">{t('profile.verified')}</span>
                  </div>
                )}

                {/* Business Category Badge */}
                {profile.business_category && (
                  <div className="mt-3">
                    <BusinessCategoryBadge category={profile.business_category} />
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-center text-muted-foreground mt-4 text-sm leading-relaxed max-w-sm mx-auto">
                  {profile.bio}
                </p>
              )}

              {/* Location & Member Info */}
              <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                {profile.location_city && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location_city}{profile.location_state ? `, ${profile.location_state}` : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{memberSince}</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="bg-background rounded-xl p-3 text-center border border-border">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-warning fill-warning" />
                    <span className="text-lg font-bold text-foreground">{(profile.rating_avg || 0).toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{profile.rating_count || 0} {t('reviews.reviews')}</p>
                </div>
                <div className="bg-background rounded-xl p-3 text-center border border-border">
                  <div className="flex items-center justify-center gap-1">
                    <Car className="w-5 h-5 text-primary" />
                    <span className="text-lg font-bold text-foreground">{listings.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t('profile.listings')}</p>
                </div>
                <div className="bg-background rounded-xl p-3 text-center border border-border">
                  <div className="flex items-center justify-center gap-1">
                    <Award className="w-5 h-5 text-warning" />
                    <span className="text-lg font-bold text-foreground">
                      {vehicleCount + partsCount + servicesCount}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t('profile.awards')}</p>
                </div>
              </div>

              {/* User Badges */}
              {profile.id && (
                <div className="mt-6">
                  <UserBadgesDisplay userId={profile.id} compact />
                </div>
              )}

              {/* Social Links */}
              {(profile.instagram_url || profile.whatsapp_number || profile.website_url) && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  {profile.instagram_url && (
                    <a
                      href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://instagram.com/${profile.instagram_url.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {profile.whatsapp_number && (
                    <a
                      href={`https://wa.me/${profile.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  )}
                  {profile.website_url && (
                    <a
                      href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="carnetworx" 
                  className="flex-1"
                  onClick={() => navigate(`/seller/${profile.id}`)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('profile.connect')}
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleShare}
                  className="shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Stats */}
        {(vehicleCount > 0 || partsCount > 0 || servicesCount > 0) && (
          <div className="px-4 mt-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {vehicleCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shrink-0">
                  <Car className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{vehicleCount}</span>
                  <span className="text-sm text-muted-foreground">{t('profile.vehicles')}</span>
                </div>
              )}
              {partsCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shrink-0">
                  <Wrench className="w-4 h-4 text-secondary" />
                  <span className="font-medium text-sm">{partsCount}</span>
                  <span className="text-sm text-muted-foreground">{t('profile.parts')}</span>
                </div>
              )}
              {servicesCount > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shrink-0">
                  <Settings2 className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm">{servicesCount}</span>
                  <span className="text-sm text-muted-foreground">{t('profile.services')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings */}
        {listings.length > 0 && (
          <section className="px-4 mt-6">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('profile.activeListings')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing) => (
                <SimpleListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {listings.length === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">{t('profile.noListings')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('profile.noListingsDesc')}</p>
          </div>
        )}
      </div>
    </>
  );
}
