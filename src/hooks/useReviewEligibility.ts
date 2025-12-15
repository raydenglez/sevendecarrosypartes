import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EligibilityResult {
  canReview: boolean;
  reason?: string;
  loading: boolean;
}

const MINIMUM_ACCOUNT_AGE_DAYS = 3;

export function useReviewEligibility(listingId: string, listingOwnerId: string): EligibilityResult {
  const [eligibility, setEligibility] = useState<EligibilityResult>({
    canReview: false,
    loading: true
  });

  useEffect(() => {
    async function checkEligibility() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check 1: Must be authenticated
      if (!user) {
        setEligibility({
          canReview: false,
          reason: 'You must be logged in to leave a review',
          loading: false
        });
        return;
      }

      // Check 2: Cannot review own listing
      if (user.id === listingOwnerId) {
        setEligibility({
          canReview: false,
          reason: 'You cannot review your own listing',
          loading: false
        });
        return;
      }

      // Check 3: Account age >= 3 days
      const accountCreated = new Date(user.created_at);
      const now = new Date();
      const accountAgeDays = Math.floor((now.getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24));
      
      if (accountAgeDays < MINIMUM_ACCOUNT_AGE_DAYS) {
        const daysRemaining = MINIMUM_ACCOUNT_AGE_DAYS - accountAgeDays;
        setEligibility({
          canReview: false,
          reason: `Your account must be at least ${MINIMUM_ACCOUNT_AGE_DAYS} days old to leave reviews. ${daysRemaining} day(s) remaining.`,
          loading: false
        });
        return;
      }

      // Check 4: Must have contacted/messaged about this listing
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listingId)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .limit(1);

      if (convError || !conversations || conversations.length === 0) {
        setEligibility({
          canReview: false,
          reason: 'You must contact the seller before leaving a review',
          loading: false
        });
        return;
      }

      // Check 5: No duplicate reviews
      const { data: existingReview, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('listing_id', listingId)
        .eq('reviewer_id', user.id)
        .maybeSingle();

      if (reviewError) {
        setEligibility({
          canReview: false,
          reason: 'Error checking review eligibility',
          loading: false
        });
        return;
      }

      if (existingReview) {
        setEligibility({
          canReview: false,
          reason: 'You have already reviewed this listing',
          loading: false
        });
        return;
      }

      // All checks passed
      setEligibility({
        canReview: true,
        loading: false
      });
    }

    if (listingId && listingOwnerId) {
      checkEligibility();
    }
  }, [listingId, listingOwnerId]);

  return eligibility;
}
