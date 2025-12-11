import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Camera, 
  Car, 
  Wrench, 
  Settings,
  MapPin,
  Scan,
  Upload,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ListingType = 'vehicle' | 'part' | 'service';

export default function PublishListing() {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState<ListingType>('vehicle');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
  ]);
  const [coverIndex, setCoverIndex] = useState(0);

  const typeOptions = [
    { id: 'vehicle' as const, label: 'Vehicle', icon: Car },
    { id: 'part' as const, label: 'Part', icon: Settings },
    { id: 'service' as const, label: 'Service', icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Publish Listing</h1>
          <Button variant="ghost" className="text-muted-foreground">
            Clear
          </Button>
        </div>
      </header>

      <div className="px-4 pt-6 space-y-6 animate-fade-in">
        {/* Image Gallery */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Visual Gallery</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Max 10 photos
            </span>
          </div>
          <div className="flex gap-3">
            {/* Cover Image */}
            <div className="relative w-32 aspect-[3/4] rounded-xl overflow-hidden bg-muted shrink-0">
              {images[coverIndex] ? (
                <>
                  <img
                    src={images[coverIndex]}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-1 rounded bg-primary text-primary-foreground">
                    COVER
                  </span>
                  <button className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Thumbnail Grid */}
            <div className="flex-1 grid grid-cols-2 gap-2">
              {images.slice(1, 3).map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button className="aspect-square rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Listing Type */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Listing Type</h2>
          <div className="grid grid-cols-3 gap-3">
            {typeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = listingType === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => setListingType(option.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* General Information */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">General Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Listing Title</label>
              <Input placeholder="Ex: 2020 Toyota Corolla XLE" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Price</label>
              <Input type="number" placeholder="0" />
            </div>
          </div>
        </section>

        {/* Publish Button */}
        <Button variant="carnexo" size="lg" className="w-full">
          Publish Listing
          <ChevronDown className="w-5 h-5 ml-2 rotate-[-90deg]" />
        </Button>

        {/* Quick Key Data */}
        {listingType === 'vehicle' && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-primary">🔑</span>
              <h2 className="text-lg font-bold text-foreground">Quick Key Data</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Make</label>
                <div className="relative">
                  <Input placeholder="Select" className="pr-10" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Model</label>
                <Input placeholder="Ex: Corolla" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Year</label>
                <Input type="number" placeholder="2023" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Mileage / Hours</label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-sm text-muted-foreground mb-1.5 block">VIN / Serial Number</label>
              <div className="relative">
                <Input placeholder="XXXXXXXXXXXXXXXXX" className="pr-16" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary flex items-center gap-1">
                  <Scan className="w-4 h-4" />
                  SCAN
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Technical Specs */}
        {listingType === 'vehicle' && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-secondary">⚙️</span>
              <h2 className="text-lg font-bold text-foreground">Technical Specs</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Fuel Type</label>
                <div className="relative">
                  <Input defaultValue="Gasoline" className="pr-10" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Transmission</label>
                <div className="relative">
                  <Input defaultValue="Automatic" className="pr-10" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Engine</label>
                <Input placeholder="Ex: 2.0L Turbo" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Color</label>
                <Input placeholder="Ex: Red" />
              </div>
            </div>
          </section>
        )}

        {/* Condition & History */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-destructive">📍</span>
            <h2 className="text-lg font-bold text-foreground">Condition & History</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Current Condition</label>
              <div className="relative">
                <Input defaultValue="Used" className="pr-10" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Documents / Certifications</label>
              <button className="w-full py-8 border-2 border-dashed border-muted rounded-xl flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Upload files</span>
                <span className="text-xs">PDF, JPG or PNG (Max 3MB)</span>
              </button>
            </div>
          </div>
        </section>

        {/* Description */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Description</h2>
            <span className="text-xs text-muted-foreground">0/1000</span>
          </div>
          <textarea
            placeholder="Describe important details, special features, etc."
            className="w-full h-32 p-4 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </section>

        {/* Location */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Location</h2>
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-success">DETECTED</span>
                    <span className="text-xs text-muted-foreground">• 2.5mi</span>
                  </div>
                  <p className="font-medium text-foreground">Miami, FL, USA</p>
                </div>
              </div>
              <button className="text-sm font-medium text-primary">Edit</button>
            </div>
            <div className="h-40">
              <img
                src="https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6a00(-80.1918,25.7617)/-80.1918,25.7617,12,0/800x400@2x?access_token=pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHJwOWhtYmkwMjR1MmpwZnFuZnk5ZmdhIn0.9Wxs0c6BcEPauFsj_TxmPA"
                alt="Location"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
