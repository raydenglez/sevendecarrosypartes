import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { mockListings } from '@/data/mockData';

export default function Favorites() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // Simulate some favorites (will be from DB when connected)
  const favorites = user ? mockListings.slice(0, 4) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show sign-in prompt for guests
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl safe-top">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-foreground">Favorites</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Save your favorites</h2>
          <p className="text-muted-foreground mb-6 max-w-[280px]">
            Sign in to save listings and access them from any device
          </p>
          <Button variant="carnexo" size="lg" onClick={() => navigate('/auth')}>
            Sign In or Create Account
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

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
