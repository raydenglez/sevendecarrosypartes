import { Heart } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { ListingCard } from '@/components/ListingCard';
import { mockListings } from '@/data/mockData';

export default function Favorites() {
  // Simulate some favorites
  const favorites = mockListings.slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-foreground">Favorites</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {favorites.length} saved listings
          </p>
        </div>
      </header>

      <main className="px-4 animate-fade-in">
        {favorites.length > 0 ? (
          <div className="space-y-3">
            {favorites.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                variant="list"
                style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">No favorites yet</h2>
            <p className="text-muted-foreground max-w-[250px]">
              Start saving listings you're interested in by tapping the heart icon
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
