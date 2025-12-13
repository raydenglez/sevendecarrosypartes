import { createContext, useContext, ReactNode } from 'react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  loading: boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  isFavorite: (listingId: string) => boolean;
  refetch: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favorites = useFavorites();

  return (
    <FavoritesContext.Provider value={favorites}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}
