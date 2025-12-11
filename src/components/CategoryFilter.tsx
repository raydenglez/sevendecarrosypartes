import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  Car, 
  Settings, 
  Wrench, 
  Paintbrush, 
  Circle,
  Bike
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  LayoutGrid,
  Car,
  Settings,
  Wrench,
  Paintbrush,
  Circle,
  Bike,
};

interface Category {
  id: string;
  label: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function CategoryFilter({ 
  categories, 
  selected, 
  onSelect,
  className 
}: CategoryFilterProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto hide-scrollbar pb-1", className)}>
      {categories.map((category) => {
        const Icon = iconMap[category.icon] || LayoutGrid;
        const isSelected = selected === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-orange"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
