import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BottomNav } from '@/components/BottomNav';
import { ListingCard } from '@/components/ListingCard';
import { ListingCardSkeleton } from '@/components/ListingCardSkeleton';
import { useNearbyListings } from '@/hooks/useNearbyListings';
import { Listing } from '@/types';

export default function Featured() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { listings: nearbyListings, loading } = useNearbyListings('vehicles', {
    query: '',
    category: 'all',
    priceRange: [0, 100000],
    maxDistance: 10000,
    minRating: 0,
    condition: [],
  });

  const featuredListings: Listing[] = useMemo(() => 
    nearbyListings
      .filter(l => l.is_premium)
      .map(l => ({
        id: l.id,
        ownerId: l.owner_id || '',
        type: l.type,
        status: 'active' as const,
        title: l.title,
        description: l.description || '',
        price: l.price || 0,
        location: {
          lat: l.location_lat || 0,
          lng: l.location_lng || 0,
          city: l.location_city || 'Unknown',
          state: l.location_state || undefined,
        },
        distance: l.distance ? parseFloat(l.distance.toFixed(1)) : undefined,
        images: l.images || ['/placeholder.svg'],
        isPremium: l.is_premium || false,
        isNegotiable: l.is_negotiable || false,
        createdAt: l.created_at || new Date().toISOString(),
        updatedAt: l.created_at || new Date().toISOString(),
      }))
  , [nearbyListings]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top border-b border-border">
        <div className="px-4 py-4 flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{t('featured.title')}</h1>
            <Flame className="w-5 h-5 text-primary" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {loading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ListingCardSkeleton key={i} variant="grid" />
              ))}
            </>
          ) : featuredListings.length > 0 ? (
            featuredListings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="grid"
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(index, 5) * 50}ms` } as React.CSSProperties}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-8 col-span-2 text-center">
              {t('featured.noFeatured')}
            </p>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}