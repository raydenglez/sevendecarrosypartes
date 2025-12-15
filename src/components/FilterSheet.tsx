import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export interface FilterOptions {
  priceRange: [number, number];
  maxDistance: number;
  minRating: number;
  condition: string[];
}

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
}

const conditionOptions = [
  { id: 'new', label: 'New' },
  { id: 'like_new', label: 'Like New' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
];

export function FilterSheet({ isOpen, onClose, filters, onApply }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleReset = () => {
    const defaultFilters: FilterOptions = {
      priceRange: [0, 1000000],
      maxDistance: 50,
      minRating: 0,
      condition: [],
    };
    setLocalFilters(defaultFilters);
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const toggleCondition = (id: string) => {
    setLocalFilters(prev => ({
      ...prev,
      condition: prev.condition.includes(id)
        ? prev.condition.filter(c => c !== id)
        : [...prev.condition, id],
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
          <button onClick={onClose} className="p-2 -mr-2">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </SheetHeader>

        <div className="py-6 space-y-8 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Price Range</Label>
            <Slider
              value={localFilters.priceRange}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
              max={1000000}
              step={5000}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${localFilters.priceRange[0].toLocaleString()}</span>
              <span>${localFilters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>

          {/* Max Distance */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Maximum Distance</Label>
            <Slider
              value={[localFilters.maxDistance]}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, maxDistance: value[0] }))}
              max={100}
              step={5}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{localFilters.maxDistance} km</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Minimum Rating</Label>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setLocalFilters(prev => ({ ...prev, minRating: rating }))}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    localFilters.minRating === rating
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {rating === 0 ? 'Any' : `${rating}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Condition</Label>
            <div className="flex flex-wrap gap-2">
              {conditionOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => toggleCondition(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    localFilters.condition.includes(option.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border flex gap-3 safe-bottom">
          <Button variant="outline" className="flex-1" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="carnexo" className="flex-1" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
