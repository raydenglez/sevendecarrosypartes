import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Search, Megaphone, X, Loader2, Star, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ListingWithSponsored {
  id: string;
  title: string;
  price: number | null;
  type: 'vehicle' | 'part' | 'service';
  images: string[] | null;
  location_city: string | null;
  location_state: string | null;
  is_sponsored: boolean | null;
  sponsored_at: string | null;
  is_premium: boolean | null;
  created_at: string | null;
  owner_id: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function SponsoredManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('sponsored');

  // Fetch sponsored listings
  const { data: sponsoredListings, isLoading: loadingSponsored } = useQuery({
    queryKey: ['sponsored-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!listings_owner_id_fkey(full_name, email)')
        .eq('is_sponsored', true)
        .eq('status', 'active')
        .order('sponsored_at', { ascending: false });

      if (error) throw error;
      return data as ListingWithSponsored[];
    },
  });

  // Search all active listings
  const { data: searchResults, isLoading: loadingSearch, refetch: searchListings } = useQuery({
    queryKey: ['search-listings', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles!listings_owner_id_fkey(full_name, email)')
        .eq('status', 'active')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ListingWithSponsored[];
    },
    enabled: searchQuery.length > 0,
  });

  // Toggle sponsored status
  const toggleSponsoredMutation = useMutation({
    mutationFn: async ({ listingId, makeSponsored }: { listingId: string; makeSponsored: boolean }) => {
      const updateData = makeSponsored 
        ? { is_sponsored: true, sponsored_at: new Date().toISOString(), sponsored_by: user?.id }
        : { is_sponsored: false, sponsored_at: null, sponsored_by: null };

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsored-listings'] });
      queryClient.invalidateQueries({ queryKey: ['search-listings'] });
      toast({
        title: variables.makeSponsored ? 'Listing Sponsored' : 'Sponsorship Removed',
        description: variables.makeSponsored 
          ? 'The listing is now marked as sponsored and will be highlighted.'
          : 'The listing is no longer sponsored.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update sponsorship status.',
        variant: 'destructive',
      });
      console.error('Error toggling sponsored:', error);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchListings();
  };

  const ListingCard = ({ listing, showRemove = false }: { listing: ListingWithSponsored; showRemove?: boolean }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img
              src={listing.images?.[0] || '/placeholder.svg'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">
                  by {listing.profiles?.full_name || listing.profiles?.email || 'Unknown'}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {listing.is_sponsored && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Megaphone className="w-3 h-3 mr-1" />
                    Sponsored
                  </Badge>
                )}
                {listing.is_premium && (
                  <Badge variant="secondary">
                    <Star className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="font-bold text-primary text-sm">
                ${listing.price?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {listing.location_city || 'Unknown'}
              </span>
              <Badge variant="outline" className="text-xs capitalize">
                {listing.type}
              </Badge>
            </div>
            {listing.sponsored_at && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Sponsored {format(new Date(listing.sponsored_at), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center">
            {showRemove ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSponsoredMutation.mutate({ listingId: listing.id, makeSponsored: false })}
                disabled={toggleSponsoredMutation.isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            ) : listing.is_sponsored ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSponsoredMutation.mutate({ listingId: listing.id, makeSponsored: false })}
                disabled={toggleSponsoredMutation.isPending}
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => toggleSponsoredMutation.mutate({ listingId: listing.id, makeSponsored: true })}
                disabled={toggleSponsoredMutation.isPending}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Megaphone className="w-4 h-4 mr-1" />
                Sponsor
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sponsored Content</h1>
          <p className="text-muted-foreground">
            Manage sponsored listings that get highlighted placement across the app.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sponsored">
              Currently Sponsored ({sponsoredListings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="add">Add Sponsored</TabsTrigger>
          </TabsList>

          <TabsContent value="sponsored" className="space-y-4 mt-4">
            {loadingSponsored ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sponsoredListings && sponsoredListings.length > 0 ? (
              <div className="space-y-3">
                {sponsoredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} showRemove />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No Sponsored Listings</h3>
                  <p className="text-muted-foreground text-sm">
                    Search for listings to mark them as sponsored.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search listings by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loadingSearch}>
                {loadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </form>

            {searchQuery && (
              <div className="space-y-3">
                {loadingSearch ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  searchResults.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No Results</h3>
                      <p className="text-muted-foreground text-sm">
                        No listings found matching "{searchQuery}".
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {!searchQuery && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">Search for Listings</h3>
                  <p className="text-muted-foreground text-sm">
                    Enter a search term to find listings you want to sponsor.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
