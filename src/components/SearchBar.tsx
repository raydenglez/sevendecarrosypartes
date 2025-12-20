import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  className?: string;
}

export function SearchBar({ 
  placeholder, 
  onSearch,
  onFilter,
  className 
}: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder || t('home.searchPlaceholder')}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-11 pr-4 h-12 bg-muted/50"
        />
      </div>
      <Button 
        variant="carnetworxOutline" 
        size="icon" 
        className="h-12 w-12 shrink-0"
        onClick={onFilter}
      >
        <SlidersHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}
