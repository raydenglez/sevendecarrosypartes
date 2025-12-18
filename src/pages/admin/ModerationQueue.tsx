import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface PendingListing {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  images: string[];
  created_at: string;
  owner_id: string;
  ai_moderation_results: {
    confidence_score: number;
    flags: string[];
    explanation: string;
    recommendation: string;
  }[];
  profiles: {
    full_name: string;
    email: string;
  };
}

export default function ModerationQueue() {
  const { user } = useAuth();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPendingListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          type,
          images,
          created_at,
          owner_id,
          ai_moderation_results(confidence_score, flags, explanation, recommendation),
          profiles:owner_id(full_name, email)
        `)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching pending listings:', error);
      toast.error('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingListings();
  }, []);

  const handleModeration = async (listingId: string, action: 'approved' | 'rejected', reason?: string) => {
    if (!user) return;
    setActionLoading(listingId);

    try {
      // Update listing status
      const newStatus = action === 'approved' ? 'active' : 'rejected';
      const { error: updateError } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', listingId);

      if (updateError) throw updateError;

      // Get AI moderation data for the log
      const listing = listings.find(l => l.id === listingId);
      const aiResult = listing?.ai_moderation_results?.[0];

      // Create moderation log
      const { error: logError } = await supabase
        .from('moderation_logs')
        .insert({
          listing_id: listingId,
          moderator_id: user.id,
          action,
          reason: reason || (action === 'approved' ? 'Manual approval' : 'Manual rejection'),
          ai_confidence_score: aiResult?.confidence_score,
          ai_flags: aiResult?.flags,
        });

      if (logError) throw logError;

      toast.success(`Listing ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
      
      // Remove from list
      setListings(prev => prev.filter(l => l.id !== listingId));
    } catch (error) {
      console.error('Error moderating listing:', error);
      toast.error('Failed to process moderation action');
    } finally {
      setActionLoading(null);
    }
  };

  const getFlagColor = (flag: string) => {
    if (flag.includes('scam') || flag.includes('counterfeit')) return 'destructive';
    if (flag.includes('spam') || flag.includes('inappropriate')) return 'destructive';
    if (flag.includes('misleading') || flag.includes('suspicious')) return 'secondary';
    return 'outline';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Moderation Queue</h1>
          <p className="text-muted-foreground">
            Review listings flagged by AI or pending manual review
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">All Clear!</h2>
              <p className="text-muted-foreground">No listings pending review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const aiResult = listing.ai_moderation_results?.[0];
              
              return (
                <Card key={listing.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{listing.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          ${listing.price?.toLocaleString()} • {listing.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          By: {listing.profiles?.full_name || listing.profiles?.email || 'Unknown'}
                        </p>
                      </div>
                      {listing.images?.[0] && (
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description || 'No description'}
                    </p>

                    {/* AI Analysis */}
                    {aiResult && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">AI Analysis</span>
                          <Badge variant="outline" className="ml-auto">
                            {Math.round((aiResult.confidence_score || 0) * 100)}% confidence
                          </Badge>
                        </div>
                        
                        {aiResult.flags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {aiResult.flags.map((flag) => (
                              <Badge key={flag} variant={getFlagColor(flag)} className="text-xs">
                                {flag.replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {aiResult.explanation && (
                          <p className="text-xs text-muted-foreground">
                            {aiResult.explanation}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Link to={`/listing/${listing.id}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                      <div className="flex-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModeration(listing.id, 'rejected', 'Content violation')}
                        disabled={actionLoading === listing.id}
                        className="text-destructive hover:text-destructive"
                      >
                        {actionLoading === listing.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleModeration(listing.id, 'approved')}
                        disabled={actionLoading === listing.id}
                      >
                        {actionLoading === listing.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
