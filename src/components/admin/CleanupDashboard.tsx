import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Trash2,
  Clock,
  Image,
  FileX,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface CleanupStats {
  staleListings: number;
  abandonedDrafts: number;
  loading: boolean;
}

export function CleanupDashboard() {
  const [stats, setStats] = useState<CleanupStats>({
    staleListings: 0,
    abandonedDrafts: 0,
    loading: true,
  });
  
  const [staleThreshold, setStaleThreshold] = useState(90);
  const [draftThreshold, setDraftThreshold] = useState(30);
  const [dryRun, setDryRun] = useState(true);
  
  const [cleaningStale, setCleaningStale] = useState(false);
  const [cleaningDrafts, setCleaningDrafts] = useState(false);
  const [cleaningImages, setCleaningImages] = useState(false);
  
  const [lastResult, setLastResult] = useState<{
    type: string;
    message: string;
    success: boolean;
  } | null>(null);

  const fetchStats = async () => {
    setStats(prev => ({ ...prev, loading: true }));
    
    try {
      // Calculate cutoff dates
      const staleCutoff = new Date();
      staleCutoff.setDate(staleCutoff.getDate() - staleThreshold);
      
      const draftCutoff = new Date();
      draftCutoff.setDate(draftCutoff.getDate() - draftThreshold);

      // Count stale active listings
      const { count: staleCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('created_at', staleCutoff.toISOString());

      // Count abandoned drafts
      const { count: draftCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft')
        .lt('created_at', draftCutoff.toISOString());

      setStats({
        staleListings: staleCount || 0,
        abandonedDrafts: draftCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [staleThreshold, draftThreshold]);

  const runCleanup = async (
    functionName: string,
    setLoading: (loading: boolean) => void,
    options: Record<string, any> = {}
  ) => {
    setLoading(true);
    setLastResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { dryRun, ...options },
      });

      if (error) throw error;

      const message = data.dryRun
        ? `Preview: ${data.message}`
        : data.message;

      setLastResult({
        type: functionName,
        message,
        success: data.success,
      });

      if (data.success) {
        toast.success(message);
        if (!data.dryRun) {
          fetchStats();
        }
      } else {
        toast.error(data.error || 'Cleanup failed');
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(error.message || 'Failed to run cleanup');
      setLastResult({
        type: functionName,
        message: error.message || 'Failed to run cleanup',
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Marketplace Cleanup</h2>
          <p className="text-sm text-muted-foreground">
            Manage stale listings, abandoned drafts, and orphaned files
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={stats.loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${stats.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Global Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cleanup Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Preview Mode (Dry Run)</Label>
              <p className="text-xs text-muted-foreground">
                See what would be cleaned without making changes
              </p>
            </div>
            <Switch checked={dryRun} onCheckedChange={setDryRun} />
          </div>
          {!dryRun && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">
                Live mode enabled - changes will be permanent
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stale Listings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">Stale Listings</CardTitle>
            </div>
            <Badge variant={stats.staleListings > 0 ? 'destructive' : 'secondary'}>
              {stats.loading ? '...' : stats.staleListings}
            </Badge>
          </div>
          <CardDescription>
            Expire active listings that haven't been updated in a while
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Threshold: {staleThreshold} days</Label>
            <Slider
              value={[staleThreshold]}
              onValueChange={(v) => setStaleThreshold(v[0])}
              min={30}
              max={180}
              step={15}
            />
            <p className="text-xs text-muted-foreground">
              Listings not updated for {staleThreshold}+ days will be expired
            </p>
          </div>
          <Button
            onClick={() => runCleanup('cleanup-stale-listings', setCleaningStale, {
              daysThreshold: staleThreshold,
            })}
            disabled={cleaningStale || stats.staleListings === 0}
            className="w-full"
            variant={dryRun ? 'outline' : 'default'}
          >
            {cleaningStale ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            {dryRun ? 'Preview' : 'Expire'} Stale Listings
          </Button>
        </CardContent>
      </Card>

      {/* Abandoned Drafts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileX className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-base">Abandoned Drafts</CardTitle>
            </div>
            <Badge variant={stats.abandonedDrafts > 0 ? 'destructive' : 'secondary'}>
              {stats.loading ? '...' : stats.abandonedDrafts}
            </Badge>
          </div>
          <CardDescription>
            Delete draft listings that were never published
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Threshold: {draftThreshold} days</Label>
            <Slider
              value={[draftThreshold]}
              onValueChange={(v) => setDraftThreshold(v[0])}
              min={7}
              max={90}
              step={7}
            />
            <p className="text-xs text-muted-foreground">
              Drafts older than {draftThreshold} days will be deleted with their images
            </p>
          </div>
          <Button
            onClick={() => runCleanup('cleanup-abandoned-drafts', setCleaningDrafts, {
              daysThreshold: draftThreshold,
            })}
            disabled={cleaningDrafts || stats.abandonedDrafts === 0}
            className="w-full"
            variant={dryRun ? 'outline' : 'destructive'}
          >
            {cleaningDrafts ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {dryRun ? 'Preview' : 'Delete'} Abandoned Drafts
          </Button>
        </CardContent>
      </Card>

      {/* Orphaned Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">Orphaned Images</CardTitle>
          </div>
          <CardDescription>
            Clean up storage files that are not referenced by any listing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => runCleanup('cleanup-orphaned-images', setCleaningImages)}
            disabled={cleaningImages}
            className="w-full"
            variant={dryRun ? 'outline' : 'destructive'}
          >
            {cleaningImages ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Image className="h-4 w-4 mr-2" />
            )}
            {dryRun ? 'Scan for' : 'Remove'} Orphaned Images
          </Button>
        </CardContent>
      </Card>

      {/* Last Result */}
      {lastResult && (
        <Card className={lastResult.success ? 'border-green-500/50' : 'border-destructive/50'}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  {lastResult.type.replace('cleanup-', '').replace(/-/g, ' ')}
                </p>
                <p className="text-sm text-muted-foreground">{lastResult.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
