import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Eye,
  Flag,
  Loader2,
  ExternalLink,
  MessageSquare,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { ReportReason, ReportStatus } from '@/types';

interface Report {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  listing_id: string;
  reporter_id: string;
  listings: {
    title: string;
    price: number;
    images: string[];
    status: string;
  };
  reporter: {
    full_name: string;
    email: string;
  };
}

export default function ReportsManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportStatus>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchReports = async (status: ReportStatus) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          description,
          status,
          created_at,
          reviewed_at,
          reviewer_notes,
          listing_id,
          reporter_id,
          listings(title, price, images, status)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reporter profiles separately
      const reportsWithReporters = await Promise.all(
        (data || []).map(async (report) => {
          const { data: reporter } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', report.reporter_id)
            .single();
          return { ...report, reporter: reporter || { full_name: null, email: null } };
        })
      );

      setReports(reportsWithReporters as Report[]);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(activeTab);
  }, [activeTab]);

  const handleReportAction = async (reportId: string, action: 'reviewed' | 'dismissed') => {
    if (!user) return;
    setActionLoading(reportId);

    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: action,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes[reportId] || null,
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success(`Report ${action === 'reviewed' ? 'marked as reviewed' : 'dismissed'}`);
      
      // Remove from list
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error('Failed to update report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTakeDownListing = async (report: Report) => {
    if (!user) return;
    setActionLoading(report.id);

    try {
      // Update listing status to rejected
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'rejected' })
        .eq('id', report.listing_id);

      if (listingError) throw listingError;

      // Mark report as reviewed
      const { error: reportError } = await supabase
        .from('reports')
        .update({
          status: 'reviewed',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes[report.id] || 'Listing taken down due to report.',
        })
        .eq('id', report.id);

      if (reportError) throw reportError;

      toast.success('Listing has been taken down');
      
      // Remove from list
      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (error) {
      console.error('Error taking down listing:', error);
      toast.error('Failed to take down listing');
    } finally {
      setActionLoading(null);
    }
  };

  const getReasonLabel = (reason: ReportReason) => {
    const labels: Record<ReportReason, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate',
      scam: 'Scam/Fraud',
      misleading: 'Misleading',
      counterfeit: 'Counterfeit',
      other: 'Other',
    };
    return labels[reason];
  };

  const getReasonColor = (reason: ReportReason) => {
    if (reason === 'scam' || reason === 'counterfeit') return 'destructive';
    if (reason === 'inappropriate' || reason === 'spam') return 'secondary';
    return 'outline';
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 pb-20 lg:pb-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Reports Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Review and manage user-submitted reports
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Flag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No Reports</h2>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending' 
                      ? 'No pending reports to review'
                      : `No ${activeTab} reports`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getReasonColor(report.reason)}>
                              {getReasonLabel(report.reason)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}
                            </span>
                          </div>
                          <CardTitle className="text-lg mt-2">
                            {report.listings?.title || 'Unknown Listing'}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            ${report.listings?.price?.toLocaleString()} • 
                            Status: {report.listings?.status}
                          </p>
                        </div>
                        {report.listings?.images?.[0] && (
                          <img 
                            src={report.listings.images[0]} 
                            alt={report.listings.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Reporter Info */}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Reported by: </span>
                        <span>{report.reporter?.full_name || report.reporter?.email || 'Unknown'}</span>
                      </div>

                      {/* Report Description */}
                      {report.description && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Reporter's Description</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        </div>
                      )}

                      {/* Reviewer Notes (for pending) */}
                      {activeTab === 'pending' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Review Notes (optional)</label>
                          <Textarea
                            value={reviewNotes[report.id] || ''}
                            onChange={(e) => setReviewNotes(prev => ({
                              ...prev,
                              [report.id]: e.target.value
                            }))}
                            placeholder="Add notes about your decision..."
                            className="min-h-[60px]"
                          />
                        </div>
                      )}

                      {/* Previous Review Notes */}
                      {report.reviewer_notes && activeTab !== 'pending' && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">Review Notes: </span>
                          <span className="text-sm text-muted-foreground">
                            {report.reviewer_notes}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2">
                        <Link to={`/listing/${report.listing_id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Listing
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                        <div className="flex-1" />
                        
                        {activeTab === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReportAction(report.id, 'dismissed')}
                              disabled={actionLoading === report.id}
                            >
                              {actionLoading === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Dismiss
                                </>
                              )}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReportAction(report.id, 'reviewed')}
                              disabled={actionLoading === report.id}
                            >
                              {actionLoading === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Reviewed
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleTakeDownListing(report)}
                              disabled={actionLoading === report.id || report.listings?.status === 'rejected'}
                            >
                              {actionLoading === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Take Down
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
