import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
import SEO from '@/components/SEO';
import { BottomNav } from '@/components/BottomNav';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ListingCardSkeleton';
import { SwipeableItem } from '@/components/SwipeableItem';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFavoritesContext } from '@/contexts/FavoritesContext';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '@/types';

export default function Favorites() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favoriteIds, toggleFavorite, loading: favoritesLoading } = useFavoritesContext();
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const { t } = useTranslation();
  const { trigger } = useHaptics();

  // Fetch listings for favorite IDs
  useEffect(() => {
    async function fetchFavoriteListings() {
      if (favoriteIds.size === 0) {
        setListings([]);
        return;
      }

      setListingsLoading(true);
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .in('id', Array.from(favoriteIds))
          .eq('status', 'active');

        if (error) throw error;

        const mappedListings: Listing[] = (data || []).map((item) => ({
          id: item.id,
          ownerId: item.owner_id,
          type: item.type,
          status: item.status || 'active',
          title: item.title,
          description: item.description || '',
          price: item.price || 0,
          location: {
            lat: item.location_lat || 0,
            lng: item.location_lng || 0,
            city: item.location_city || 'Unknown',
            state: item.location_state || undefined,
          },
          images: item.images || ['/placeholder.svg'],
          isPremium: item.is_premium || false,
          isNegotiable: item.is_negotiable || false,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString(),
        }));

        setListings(mappedListings);
      } catch (error) {
        console.error('Error fetching favorite listings:', error);
      } finally {
        setListingsLoading(false);
      }
    }

    if (!favoritesLoading) {
      fetchFavoriteListings();
    }
  }, [favoriteIds, favoritesLoading]);

  const isLoading = authLoading || favoritesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl pt-[calc(env(safe-area-inset-top)+12px)]">
          <div className="px-4 pt-8 pb-4">
            <h1 className="text-xl font-bold text-foreground">{t('favorites.title')}</h1>
          </div>
        </header>
        <main className="px-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListingCardSkeleton key={i} variant="list" />
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Show sign-in prompt for guests
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl pt-[calc(env(safe-area-inset-top)+12px)]">
          <div className="px-4 pt-8 pb-4">
            <h1 className="text-xl font-bold text-foreground">{t('favorites.title')}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('favorites.signInPrompt')}</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            {t('favorites.signInPromptDesc')}
          </p>
          <Button variant="carnetworx" size="lg" onClick={() => navigate('/auth')}>
            {t('auth.signInOrCreate')}
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <>
      <SEO titleKey="seo.favorites.title" descriptionKey="seo.favorites.description" path="/favorites" />
      <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="px-4 pt-8 pb-4">
          <h1 className="text-xl font-bold text-foreground">{t('favorites.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('favorites.savedCount', { count: listings.length })}
          </p>
        </div>
      </header>

      <main className="px-4 animate-fade-in">
        {listingsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <ListingCardSkeleton key={i} variant="list" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="space-y-3">
            {listings.map((listing, index) => (
              <SwipeableItem
                key={listing.id}
                onDelete={() => {
                  trigger('warning');
                  toggleFavorite(listing.id);
                  setListings(prev => prev.filter(l => l.id !== listing.id));
                }}
              >
                <ListingCard
                  listing={listing}
                  variant="list"
                  style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
                />
              </SwipeableItem>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">{t('favorites.noFavorites')}</h2>
            <p className="text-muted-foreground max-w-[250px]">
              {t('favorites.noFavoritesDesc')}
            </p>
          </div>
        )}
      </main>

      <BottomNav />
      </div>
    </>
  );
}