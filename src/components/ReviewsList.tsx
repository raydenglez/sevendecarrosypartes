import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { StarRating } from '@/components/StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, pt, type Locale } from 'date-fns/locale';

export interface Review {
  id: string;
  rating: number;
  communication_rating: number | null;
  accuracy_rating: number | null;
  service_rating: number | null;
  comment: string | null;
  created_at: string;
  reviewer: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewsListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ReviewsList({ reviews, averageRating, totalReviews }: ReviewsListProps) {
  const { t, i18n } = useTranslation();
  
  const getLocale = () => {
    const locales: Record<string, Locale> = { en: enUS, es, pt };
    return locales[i18n.language] || enUS;
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('reviews.noReviews')}</p>
        <p className="text-sm mt-1">{t('reviews.beFirst')}</p>
      </div>
    );
  }

  // Calculate rating breakdown averages
  const communicationAvg = reviews.filter(r => r.communication_rating).reduce((acc, r) => acc + (r.communication_rating || 0), 0) / (reviews.filter(r => r.communication_rating).length || 1);
  const accuracyAvg = reviews.filter(r => r.accuracy_rating).reduce((acc, r) => acc + (r.accuracy_rating || 0), 0) / (reviews.filter(r => r.accuracy_rating).length || 1);
  const serviceAvg = reviews.filter(r => r.service_rating).reduce((acc, r) => acc + (r.service_rating || 0), 0) / (reviews.filter(r => r.service_rating).length || 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{averageRating.toFixed(1)}</div>
          <StarRating rating={Math.round(averageRating)} size="sm" />
          <div className="text-xs text-muted-foreground mt-1">{totalReviews} {t('reviews.reviewsCount')}</div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('reviews.communication')}</span>
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(communicationAvg)} size="sm" />
              <span className="text-foreground w-6">{communicationAvg.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('reviews.accuracy')}</span>
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(accuracyAvg)} size="sm" />
              <span className="text-foreground w-6">{accuracyAvg.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('reviews.service')}</span>
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(serviceAvg)} size="sm" />
              <span className="text-foreground w-6">{serviceAvg.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.reviewer?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                  {review.reviewer?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {review.reviewer?.full_name || t('reviews.anonymous')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: getLocale() })}
                  </span>
                </div>
                <StarRating rating={review.rating} size="sm" className="mt-1" />
                {review.comment && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
