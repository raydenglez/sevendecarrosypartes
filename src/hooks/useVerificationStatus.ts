import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface VerificationRequest {
  id: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export function useVerificationStatus() {
  const { user } = useAuth();
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const fetchStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user is already verified
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single();

      setIsVerified(profile?.is_verified || false);

      // Get latest verification request
      const { data, error } = await supabase
        .from('verification_requests')
        .select('id, status, rejection_reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setRequest(data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  return { 
    request, 
    loading, 
    isVerified,
    refetch: fetchStatus,
    canRequestVerification: !isVerified && (!request || request.status === 'rejected'),
    hasPendingRequest: request?.status === 'pending',
  };
}
