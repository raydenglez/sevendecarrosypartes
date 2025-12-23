import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Bell, Send, Loader2, CheckCircle2, XCircle, Clock, Radio } from 'lucide-react';
import { format } from 'date-fns';

type BroadcastTarget = 'all' | 'sellers' | 'buyers' | 'verified_users';
type BroadcastStatus = 'pending' | 'sending' | 'completed' | 'failed';

interface BroadcastNotification {
  id: string;
  admin_id: string;
  title: string;
  body: string;
  target_audience: BroadcastTarget;
  sent_count: number;
  failed_count: number;
  status: BroadcastStatus;
  created_at: string;
  completed_at: string | null;
}

const targetLabels: Record<BroadcastTarget, string> = {
  all: 'All Users',
  sellers: 'Dealers Only',
  buyers: 'Individual Users',
  verified_users: 'Verified Users',
};

const statusConfig: Record<BroadcastStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
  sending: { label: 'Sending', icon: Radio, className: 'bg-primary/20 text-primary' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-500/20 text-green-600' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/20 text-destructive' },
};

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<BroadcastTarget>('all');

  // Fetch broadcast history
  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['broadcast-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BroadcastNotification[];
    },
  });

  // Send broadcast mutation
  const sendBroadcast = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create broadcast record
      const { data: broadcast, error: insertError } = await supabase
        .from('broadcast_notifications')
        .insert({
          admin_id: user.id,
          title,
          body,
          target_audience: targetAudience,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger edge function
      const { error: fnError } = await supabase.functions.invoke('broadcast-notification', {
        body: {
          title,
          body,
          targetAudience,
          broadcastId: broadcast.id,
        },
      });

      if (fnError) {
        // Update status to failed
        await supabase
          .from('broadcast_notifications')
          .update({ status: 'failed' })
          .eq('id', broadcast.id);
        throw fnError;
      }

      return broadcast;
    },
    onSuccess: () => {
      toast.success('Broadcast notification sent!');
      setTitle('');
      setBody('');
      setTargetAudience('all');
      queryClient.invalidateQueries({ queryKey: ['broadcast-notifications'] });
    },
    onError: (error) => {
      console.error('Failed to send broadcast:', error);
      toast.error('Failed to send notification');
    },
  });

  const isFormValid = title.trim().length > 0 && body.trim().length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground">Send announcements to app users</p>
        </div>

        {/* Compose Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Compose Notification
            </CardTitle>
            <CardDescription>
              Send a push notification to all users or a specific group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Notification title (max 50 characters)"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground text-right">{title.length}/50</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Notification message (max 200 characters)"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">{body.length}/200</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Select value={targetAudience} onValueChange={(v) => setTargetAudience(v as BroadcastTarget)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="sellers">Dealers Only</SelectItem>
                  <SelectItem value="buyers">Individual Users Only</SelectItem>
                  <SelectItem value="verified_users">Verified Users Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            {(title || body) && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Preview</p>
                <p className="font-semibold">{title || 'Title'}</p>
                <p className="text-sm text-muted-foreground">{body || 'Message'}</p>
              </div>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full" 
                  disabled={!isFormValid || sendBroadcast.isPending}
                >
                  {sendBroadcast.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Broadcast</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will send a push notification to <strong>{targetLabels[targetAudience].toLowerCase()}</strong>. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="rounded-lg border bg-muted/50 p-3 my-2">
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => sendBroadcast.mutate()}>
                    Send to {targetLabels[targetAudience]}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcast History</CardTitle>
            <CardDescription>View past notifications sent from the admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : broadcasts && broadcasts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts.map((broadcast) => {
                      const statusInfo = statusConfig[broadcast.status];
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <TableRow key={broadcast.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(broadcast.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={broadcast.title}>
                            {broadcast.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {targetLabels[broadcast.target_audience]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {broadcast.sent_count}
                          </TableCell>
                          <TableCell className="text-destructive font-medium">
                            {broadcast.failed_count}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.className}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No broadcast notifications yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
