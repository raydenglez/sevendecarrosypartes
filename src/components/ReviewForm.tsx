import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/StarRating';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  listingId: string;
  onSuccess: () => void;
  eligibility: {
    canReview: boolean;
    reason?: string;
  };
}

export function ReviewForm({ listingId, onSuccess, eligibility }: ReviewFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [accuracyRating, setAccuracyRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      toast({
        title: t('reviews.ratingRequired'),
        description: t('reviews.selectRating'),
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('toast.error'),
        description: t('reviews.loginRequired'),
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      listing_id: listingId,
      reviewer_id: user.id,
      rating: overallRating,
      communication_rating: communicationRating || null,
      accuracy_rating: accuracyRating || null,
      service_rating: serviceRating || null,
      comment: comment.trim() || null
    });

    if (error) {
      toast({
        title: t('toast.error'),
        description: t('reviews.submitError'),
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('reviews.submitted'),
        description: t('reviews.thankYou')
      });
      onSuccess();
      // Reset form
      setOverallRating(0);
      setCommunicationRating(0);
      setAccuracyRating(0);
      setServiceRating(0);
      setComment('');
    }
    
    setIsSubmitting(false);
  };

  if (!eligibility.canReview) {
    return (
      <div className="p-4 bg-muted/50 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">{t('reviews.cannotReview')}</p>
          <p className="text-sm text-muted-foreground mt-1">{eligibility.reason}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4 bg-card rounded-xl border border-border">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle className="w-4 h-4 text-green-500" />
        {t('reviews.canReview')}
      </div>

      {/* Overall Rating */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          {t('reviews.overallRating')} *
        </label>
        <StarRating
          rating={overallRating}
          size="lg"
          interactive
          onChange={setOverallRating}
        />
      </div>

      {/* Breakdown Ratings */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('reviews.communication')}</span>
          <StarRating
            rating={communicationRating}
            size="sm"
            interactive
            onChange={setCommunicationRating}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('reviews.accuracy')}</span>
          <StarRating
            rating={accuracyRating}
            size="sm"
            interactive
            onChange={setAccuracyRating}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t('reviews.serviceQuality')}</span>
          <StarRating
            rating={serviceRating}
            size="sm"
            interactive
            onChange={setServiceRating}
          />
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          {t('reviews.yourReview')}
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('reviews.commentPlaceholder')}
          maxLength={500}
          className="resize-none"
          rows={3}
        />
        <span className="text-xs text-muted-foreground mt-1 block text-right">
          {comment.length}/500
        </span>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || overallRating === 0}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('reviews.submitting')}
          </>
        ) : (
          t('reviews.submitReview')
        )}
      </Button>
    </form>
  );
}
