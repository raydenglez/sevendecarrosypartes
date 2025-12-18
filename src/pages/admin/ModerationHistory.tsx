import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  History,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import type { ModerationAction } from '@/types';

interface ModerationLog {
  id: string;
  listing_id: string;
  action: ModerationAction;
  reason: string | null;
  ai_confidence_score: number | null;
  ai_flags: string[] | null;
  created_at: string;
  listings: {
    title: string;
    images: string[];
  };
  moderator: {
    full_name: string;
    email: string;
  };
}

export default function ModerationHistory() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('moderation_logs')
          .select(`
            id,
            listing_id,
            action,
            reason,
            ai_confidence_score,
            ai_flags,
            created_at,
            moderator_id,
            listings(title, images)
          `)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Fetch moderator profiles separately
        const logsWithModerators = await Promise.all(
          (data || []).map(async (log) => {
            const { data: moderator } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', log.moderator_id)
              .single();
            return { ...log, moderator: moderator || { full_name: null, email: null } };
          })
        );

        setLogs(logsWithModerators as ModerationLog[]);
      } catch (error) {
        console.error('Error fetching moderation logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionIcon = (action: ModerationAction) => {
    switch (action) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'flagged':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <History className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: ModerationAction) => {
    switch (action) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      case 'flagged':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Moderation History</h1>
          <p className="text-muted-foreground">
            Audit log of all moderation actions
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No History</h2>
              <p className="text-muted-foreground">
                No moderation actions have been taken yet
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getActionIcon(log.action)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${getActionColor(log.action)}`}>
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <Link 
                          to={`/listing/${log.listing_id}`}
                          className="text-primary hover:underline truncate flex items-center gap-1"
                          target="_blank"
                        >
                          {log.listings?.title || 'Unknown Listing'}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        By {log.moderator?.full_name || log.moderator?.email || 'Unknown'} •{' '}
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </p>

                      {log.reason && (
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Reason: </span>
                          {log.reason}
                        </p>
                      )}

                      {log.ai_flags && log.ai_flags.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">AI Flags:</span>
                          {log.ai_flags.map((flag) => (
                            <Badge key={flag} variant="outline" className="text-xs">
                              {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                          {log.ai_confidence_score && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(log.ai_confidence_score * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {log.listings?.images?.[0] && (
                      <img 
                        src={log.listings.images[0]} 
                        alt={log.listings.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
