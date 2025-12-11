import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface SettingsItemProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  description?: string;
  value?: string;
  badge?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SettingsItem({
  icon,
  iconBg = 'bg-muted',
  label,
  description,
  value,
  badge,
  onClick,
  className,
}: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 py-3 px-4 transition-colors hover:bg-muted/50 rounded-xl",
        className
      )}
    >
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {value && (
        <span className="text-sm text-muted-foreground">{value}</span>
      )}
      {badge && (
        <span className="w-2 h-2 rounded-full bg-primary" />
      )}
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );
}
