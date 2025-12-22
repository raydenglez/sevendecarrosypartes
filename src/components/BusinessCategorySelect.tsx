import { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export const BUSINESS_CATEGORIES = [
  'buyer',
  'car_seller',
  'car_dealership',
  'mechanic_shop',
  'tires_shop',
  'auto_collision',
  'auto_repair_shop',
  'auto_injury_lawyer',
  'window_tinting',
  'auto_insurance',
  'towing',
  'car_wash',
  'car_detailing',
  'body_shop',
  'paint_shop',
  'mobile_mechanic',
  'electrician_expert',
  'car_brokers',
  'car_wrappers',
  'atv_utv_dealer',
  'dirt_bike_dealer',
  'yacht_dealer',
  'car_rentals',
  'car_transport',
  'rebuilt_inspection',
  'roadside',
  'locksmith',
  'audio_car',
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number];

interface BusinessCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  error?: string;
}

export function BusinessCategorySelect({
  value,
  onChange,
  className,
  error,
}: BusinessCategorySelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCategories = BUSINESS_CATEGORIES.filter((category) =>
    t(`businessCategory.${category}`).toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value ? t(`businessCategory.${value}`) : t('auth.selectCategory');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between h-12 rounded-xl bg-background/50 border-border/50 hover:bg-background/80 font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive',
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-1">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('common.noResults')}
              </p>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onChange(category);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg transition-colors text-left',
                    'hover:bg-accent hover:text-accent-foreground',
                    value === category && 'bg-primary/10 text-primary'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      value === category ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{t(`businessCategory.${category}`)}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Badge component for displaying category on profile
export function BusinessCategoryBadge({ category }: { category: string }) {
  const { t } = useTranslation();
  
  if (!category) return null;
  
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {t(`businessCategory.${category}`)}
    </span>
  );
}
