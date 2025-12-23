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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Bell, Send, Loader2, CheckCircle2, XCircle, Clock, Radio, CalendarIcon, Timer, FileText, Plus, Trash2, Edit2, Save } from 'lucide-react';
import { format, addMinutes, setHours, setMinutes, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';

type BroadcastTarget = 'all' | 'sellers' | 'buyers' | 'verified_users';
type BroadcastStatus = 'pending' | 'sending' | 'completed' | 'failed' | 'scheduled';

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
  scheduled_for: string | null;
}

interface NotificationTemplate {
  id: string;
  admin_id: string;
  name: string;
  title: string;
  body: string;
  target_audience: string;
  created_at: string;
  updated_at: string;
}

const targetLabels: Record<BroadcastTarget, string> = {
  all: 'All Users',
  sellers: 'Dealers Only',
  buyers: 'Individual Users',
  verified_users: 'Verified Users',
};

const statusConfig: Record<BroadcastStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
  scheduled: { label: 'Scheduled', icon: Timer, className: 'bg-blue-500/20 text-blue-600' },
  sending: { label: 'Sending', icon: Radio, className: 'bg-primary/20 text-primary' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-green-500/20 text-green-600' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/20 text-destructive' },
};

// Generate time options in 15-minute intervals
const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { value: time, label: format(setMinutes(setHours(new Date(), hours), minutes), 'h:mm a') };
});

export default function AdminNotifications() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState<BroadcastTarget>('all');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  
  // Template state
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateAudience, setTemplateAudience] = useState<BroadcastTarget>('all');

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

  // Fetch templates
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as NotificationTemplate[];
    },
  });

  // Save template mutation
  const saveTemplate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!templateName.trim() || !templateTitle.trim() || !templateBody.trim()) {
        throw new Error('All fields are required');
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('notification_templates')
          .update({
            name: templateName.trim(),
            title: templateTitle.trim(),
            body: templateBody.trim(),
            target_audience: templateAudience,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_templates')
          .insert({
            admin_id: user.id,
            name: templateName.trim(),
            title: templateTitle.trim(),
            body: templateBody.trim(),
            target_audience: templateAudience,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingTemplate ? 'Template updated!' : 'Template saved!');
      resetTemplateForm();
      setTemplateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to save template');
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
    onError: () => {
      toast.error('Failed to delete template');
    },
  });

  // Send broadcast mutation
  const sendBroadcast = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let scheduledFor: string | null = null;
      if (isScheduled && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(':').map(Number);
        const scheduledDateTime = setMinutes(setHours(scheduledDate, hours), minutes);
        
        if (isBefore(scheduledDateTime, addMinutes(new Date(), 5))) {
          throw new Error('Scheduled time must be at least 5 minutes in the future');
        }
        
        scheduledFor = scheduledDateTime.toISOString();
      }

      const { data: broadcast, error: insertError } = await supabase
        .from('broadcast_notifications')
        .insert({
          admin_id: user.id,
          title,
          body,
          target_audience: targetAudience,
          status: isScheduled ? 'scheduled' : 'pending',
          scheduled_for: scheduledFor,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (!isScheduled) {
        const { error: fnError } = await supabase.functions.invoke('broadcast-notification', {
          body: {
            title,
            body,
            targetAudience,
            broadcastId: broadcast.id,
          },
        });

        if (fnError) {
          await supabase
            .from('broadcast_notifications')
            .update({ status: 'failed' })
            .eq('id', broadcast.id);
          throw fnError;
        }
      }

      return broadcast;
    },
    onSuccess: () => {
      toast.success(isScheduled ? 'Notification scheduled!' : 'Broadcast notification sent!');
      setTitle('');
      setBody('');
      setTargetAudience('all');
      setIsScheduled(false);
      setScheduledDate(undefined);
      setScheduledTime('09:00');
      queryClient.invalidateQueries({ queryKey: ['broadcast-notifications'] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send notification');
    },
  });

  // Cancel scheduled notification
  const cancelScheduled = useMutation({
    mutationFn: async (broadcastId: string) => {
      const { error } = await supabase
        .from('broadcast_notifications')
        .update({ status: 'failed' })
        .eq('id', broadcastId)
        .eq('status', 'scheduled');

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Scheduled notification cancelled');
      queryClient.invalidateQueries({ queryKey: ['broadcast-notifications'] });
    },
    onError: () => {
      toast.error('Failed to cancel notification');
    },
  });

  const resetTemplateForm = () => {
    setTemplateName('');
    setTemplateTitle('');
    setTemplateBody('');
    setTemplateAudience('all');
    setEditingTemplate(null);
  };

  const openEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateTitle(template.title);
    setTemplateBody(template.body);
    setTemplateAudience(template.target_audience as BroadcastTarget);
    setTemplateDialogOpen(true);
  };

  const useTemplate = (template: NotificationTemplate) => {
    setTitle(template.title);
    setBody(template.body);
    setTargetAudience(template.target_audience as BroadcastTarget);
    toast.success(`Template "${template.name}" loaded`);
  };

  const saveCurrentAsTemplate = () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in title and message first');
      return;
    }
    setTemplateName('');
    setTemplateTitle(title);
    setTemplateBody(body);
    setTemplateAudience(targetAudience);
    setEditingTemplate(null);
    setTemplateDialogOpen(true);
  };

  const isFormValid = title.trim().length > 0 && body.trim().length > 0 && (!isScheduled || scheduledDate);
  const isTemplateFormValid = templateName.trim().length > 0 && templateTitle.trim().length > 0 && templateBody.trim().length > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Center</h1>
          <p className="text-muted-foreground">Send announcements to app users</p>
        </div>

        <Tabs defaultValue="compose" className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="compose" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Bell className="h-4 w-4" />
              <span className="hidden xs:inline">Compose</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden xs:inline">Templates</span>
              {templates && templates.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{templates.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden xs:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose">
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
                {/* Template Selector */}
                {templates && templates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Use Template</label>
                    <Select onValueChange={(id) => {
                      const template = templates.find(t => t.id === id);
                      if (template) useTemplate(template);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex flex-col">
                              <span>{template.name}</span>
                              <span className="text-xs text-muted-foreground">{template.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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

                {/* Schedule Toggle */}
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="schedule-mode"
                    checked={isScheduled}
                    onCheckedChange={setIsScheduled}
                  />
                  <Label htmlFor="schedule-mode" className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Schedule for later
                  </Label>
                </div>

                {/* Schedule Date/Time Picker */}
                {isScheduled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            disabled={(date) => isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)))}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time</label>
                      <Select value={scheduledTime} onValueChange={setScheduledTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {timeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {scheduledDate && (
                      <div className="col-span-full text-sm text-muted-foreground">
                        <Timer className="inline-block mr-1 h-4 w-4" />
                        Will be sent on {format(scheduledDate, 'MMMM d, yyyy')} at {timeOptions.find(t => t.value === scheduledTime)?.label}
                      </div>
                    )}
                  </div>
                )}

                {/* Preview */}
                {(title || body) && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Preview</p>
                    <p className="font-semibold">{title || 'Title'}</p>
                    <p className="text-sm text-muted-foreground">{body || 'Message'}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={saveCurrentAsTemplate}
                    disabled={!title.trim() || !body.trim()}
                    className="flex-shrink-0"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Template
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="flex-1" 
                        disabled={!isFormValid || sendBroadcast.isPending}
                      >
                        {sendBroadcast.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isScheduled ? 'Scheduling...' : 'Sending...'}
                          </>
                        ) : (
                          <>
                            {isScheduled ? <Timer className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                            {isScheduled ? 'Schedule Notification' : 'Send Notification'}
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {isScheduled ? 'Confirm Schedule' : 'Confirm Broadcast'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {isScheduled ? (
                            <>This will schedule a push notification for <strong>{targetLabels[targetAudience].toLowerCase()}</strong> on {scheduledDate && format(scheduledDate, 'MMMM d, yyyy')} at {timeOptions.find(t => t.value === scheduledTime)?.label}.</>
                          ) : (
                            <>This will send a push notification to <strong>{targetLabels[targetAudience].toLowerCase()}</strong>. This action cannot be undone.</>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="rounded-lg border bg-muted/50 p-3 my-2">
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">{body}</p>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => sendBroadcast.mutate()}>
                          {isScheduled ? 'Schedule' : `Send to ${targetLabels[targetAudience]}`}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <FileText className="h-5 w-5" />
                    Notification Templates
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Save and reuse common notification messages
                  </CardDescription>
                </div>
                <Dialog open={templateDialogOpen} onOpenChange={(open) => {
                  setTemplateDialogOpen(open);
                  if (!open) resetTemplateForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
                      <DialogDescription>
                        Save a notification template for quick reuse
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Template Name</Label>
                        <Input
                          placeholder="e.g., Weekly Update, New Feature"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value.slice(0, 50))}
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Notification title"
                          value={templateTitle}
                          onChange={(e) => setTemplateTitle(e.target.value.slice(0, 50))}
                          maxLength={50}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          placeholder="Notification message"
                          value={templateBody}
                          onChange={(e) => setTemplateBody(e.target.value.slice(0, 200))}
                          maxLength={200}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Audience</Label>
                        <Select value={templateAudience} onValueChange={(v) => setTemplateAudience(v as BroadcastTarget)}>
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
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => saveTemplate.mutate()} disabled={!isTemplateFormValid || saveTemplate.isPending}>
                        {saveTemplate.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {editingTemplate ? 'Update' : 'Save'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : templates && templates.length > 0 ? (
                  <div className="grid gap-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex flex-col sm:flex-row sm:items-start justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm sm:text-base">{template.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {targetLabels[template.target_audience as BroadcastTarget]}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-foreground truncate">{template.title}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{template.body}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:ml-4 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => useTemplate(template)}
                            className="flex-1 sm:flex-none"
                          >
                            Use
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditTemplate(template)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteTemplate.mutate(template.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No templates yet</p>
                    <p className="text-sm">Create your first template to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Broadcast History</CardTitle>
                <CardDescription className="text-xs sm:text-sm">View past and scheduled notifications</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : broadcasts && broadcasts.length > 0 ? (
                  <>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                      {broadcasts.map((broadcast) => {
                        const statusInfo = statusConfig[broadcast.status];
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <div key={broadcast.id} className="p-3 rounded-lg border bg-card">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{broadcast.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(broadcast.created_at), 'MMM d, yyyy HH:mm')}
                                </p>
                                {broadcast.scheduled_for && broadcast.status === 'scheduled' && (
                                  <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                                    <Timer className="h-3 w-3" />
                                    {format(new Date(broadcast.scheduled_for), 'MMM d, HH:mm')}
                                  </p>
                                )}
                              </div>
                              <Badge className={cn(statusInfo.className, "text-xs flex-shrink-0")}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="secondary" className="text-xs">
                                {targetLabels[broadcast.target_audience]}
                              </Badge>
                              <div className="flex items-center gap-3">
                                <span className="text-green-600 font-medium">{broadcast.sent_count} sent</span>
                                {broadcast.failed_count > 0 && (
                                  <span className="text-destructive font-medium">{broadcast.failed_count} failed</span>
                                )}
                              </div>
                            </div>
                            {broadcast.status === 'scheduled' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 text-destructive hover:text-destructive"
                                onClick={() => cancelScheduled.mutate(broadcast.id)}
                                disabled={cancelScheduled.isPending}
                              >
                                Cancel Scheduled
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Audience</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Failed</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {broadcasts.map((broadcast) => {
                            const statusInfo = statusConfig[broadcast.status];
                            const StatusIcon = statusInfo.icon;
                            
                            return (
                              <TableRow key={broadcast.id}>
                                <TableCell className="whitespace-nowrap">
                                  <div>
                                    {format(new Date(broadcast.created_at), 'MMM d, yyyy HH:mm')}
                                    {broadcast.scheduled_for && broadcast.status === 'scheduled' && (
                                      <div className="text-xs text-blue-600">
                                        <Timer className="inline-block mr-1 h-3 w-3" />
                                        {format(new Date(broadcast.scheduled_for), 'MMM d, HH:mm')}
                                      </div>
                                    )}
                                  </div>
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
                                <TableCell>
                                  {broadcast.status === 'scheduled' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => cancelScheduled.mutate(broadcast.id)}
                                      disabled={cancelScheduled.isPending}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No broadcast notifications yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
