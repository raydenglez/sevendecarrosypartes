import { Star, CheckCircle, ChevronRight, User as UserIcon } from 'lucide-react';
import { User } from '@/types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface SellerCardProps {
  seller: User;
  className?: string;
}

export function SellerCard({ seller, className }: SellerCardProps) {
  return (
    <Link
      to={`/seller/${seller.id}`}
      className={cn(
        "flex items-center gap-4 p-4 bg-card rounded-2xl transition-all duration-200 hover:bg-card-elevated",
        className
      )}
    >
      <div className="relative">
        {seller.avatarUrl ? (
          <img
            src={seller.avatarUrl}
            alt={seller.name}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        {seller.isVerified && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-success-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{seller.name}</h3>
          {seller.type === 'pro_seller' && (
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-secondary text-secondary-foreground">
              Pro Seller
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Member since {seller.memberSince}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-4 h-4 text-warning fill-warning" />
          <span className="text-sm font-medium text-foreground">{seller.ratingAvg}</span>
          <span className="text-sm text-muted-foreground">({seller.totalReviews})</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </Link>
  );
}
