import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, List, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Map } from '@/components/Map';
import { mockListings } from '@/data/mockData';
import { ListingCard } from '@/components/ListingCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function MapView() {
  const navigate = useNavigate();
  const [showListings, setShowListings] = useState(false);
  
  // Convert listings to map markers
  const markers = mockListings
    .filter(listing => listing.location?.lat && listing.location?.lng)
    .map(listing => ({
      lng: listing.location!.lng,
      lat: listing.location!.lat,
      title: listing.title,
      price: `$${listing.price.toLocaleString()}`
    }));

  // Default center (San Francisco area, or first listing if available)
  const defaultCenter: [number, number] = markers.length > 0 
    ? [markers[0].lng, markers[0].lat]
    : [-122.4194, 37.7749];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 safe-top">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:bg-card"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:bg-card"
            >
              <Layers className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-full bg-card/90 backdrop-blur-sm shadow-card hover:bg-card"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map */}
      <Map 
        center={defaultCenter}
        zoom={11}
        markers={markers}
        className="flex-1"
      />

      {/* Bottom Sheet for Listings */}
      <Sheet open={showListings} onOpenChange={setShowListings}>
        <SheetTrigger asChild>
          <Button
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-full shadow-orange safe-bottom"
          >
            <List className="w-4 h-4 mr-2" />
            View {mockListings.length} Listings
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Nearby Listings</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto h-[calc(100%-4rem)] hide-scrollbar pb-6">
            {mockListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} variant="list" />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
