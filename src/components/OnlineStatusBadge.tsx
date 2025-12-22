import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface OnlineStatusBadgeProps {
  isOnline: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OnlineStatusBadge({ 
  isOnline, 
  showText = false, 
  size = 'md',
  className 
}: OnlineStatusBadgeProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span 
        className={cn(
          "rounded-full shrink-0",
          sizeClasses[size],
          isOnline 
            ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" 
            : "bg-muted-foreground/40"
        )}
      />
      {showText && (
        <span className={cn(
          "text-xs",
          isOnline ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
        )}>
          {isOnline ? t('status.online', 'Online') : t('status.offline', 'Offline')}
        </span>
      )}
    </div>
  );
}

interface OnlineStatusDotProps {
  isOnline: boolean;
  className?: string;
}

export function OnlineStatusDot({ isOnline, className }: OnlineStatusDotProps) {
  return (
    <span 
      className={cn(
        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
        isOnline 
          ? "bg-green-500" 
          : "bg-muted-foreground/40",
        className
      )}
    />
  );
}
