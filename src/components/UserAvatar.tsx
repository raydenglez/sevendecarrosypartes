import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
  xl: 'w-24 h-24',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-10 h-10',
};

export function UserAvatar({ src, alt = 'User', size = 'md', className }: UserAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-muted flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <User className={cn('text-muted-foreground', iconSizeClasses[size])} />
    </div>
  );
}
