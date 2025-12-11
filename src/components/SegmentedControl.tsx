import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  options: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  selected,
  onSelect,
  className,
}: SegmentedControlProps) {
  return (
    <div className={cn("flex bg-muted rounded-full p-1", className)}>
      {options.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "flex-1 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200",
              isSelected
                ? "bg-primary text-primary-foreground shadow-orange"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
