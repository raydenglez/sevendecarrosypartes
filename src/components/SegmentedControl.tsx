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
    <div className={cn("flex gap-6 border-b border-border/30", className)}>
      {options.map((option) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "relative pb-2.5 text-sm font-medium transition-all duration-200",
              isSelected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            {option.label}
            {isSelected && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}