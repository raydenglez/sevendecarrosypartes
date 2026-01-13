import { useState } from 'react';
import { RefreshCw, Terminal, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const EDGE_FUNCTIONS = [
  'broadcast-notification',
  'cleanup-abandoned-drafts',
  'cleanup-empty-conversations',
  'cleanup-expired-sponsorships',
  'cleanup-orphaned-images',
  'cleanup-stale-listings',
  'delete-account',
  'get-vapid-key',
  'moderate-listing',
  'process-scheduled-notifications',
  'send-ban-notification',
  'send-push-notification',
  'send-takedown-notification',
] as const;

interface LogEntry {
  event_message: string;
  event_type: string;
  level: 'log' | 'info' | 'warn' | 'error';
  timestamp: number;
}

interface EdgeFunctionLogsProps {
  logs: Record<string, LogEntry[]>;
  isLoading: boolean;
  onRefresh: () => void;
}

function formatTimestamp(timestamp: number): string {
  // Supabase logs use microseconds
  const date = new Date(timestamp / 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getLogIcon(level: string, eventType: string) {
  if (eventType === 'Boot') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (eventType === 'Shutdown') return <Info className="h-3.5 w-3.5 text-muted-foreground" />;
  if (level === 'error') return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  if (level === 'warn') return <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />;
  return <Terminal className="h-3.5 w-3.5 text-muted-foreground" />;
}

function getLogBadgeVariant(eventType: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (eventType) {
    case 'Boot':
      return 'default';
    case 'Shutdown':
      return 'secondary';
    case 'Log':
      return 'outline';
    default:
      return 'outline';
  }
}

export function EdgeFunctionLogs({ logs, isLoading, onRefresh }: EdgeFunctionLogsProps) {
  const [selectedFunction, setSelectedFunction] = useState<string>(EDGE_FUNCTIONS[0]);

  const currentLogs = logs[selectedFunction] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedFunction} onValueChange={setSelectedFunction}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select function" />
          </SelectTrigger>
          <SelectContent>
            {EDGE_FUNCTIONS.map((fn) => (
              <SelectItem key={fn} value={fn}>
                <span className="font-mono text-sm">{fn}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      <ScrollArea className="h-[400px] rounded-lg border border-border bg-muted/30">
        {currentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
            <Terminal className="h-8 w-8 mb-3" />
            <p className="text-sm">No logs available for this function</p>
            <p className="text-xs mt-1">Try refreshing or select a different function</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {currentLogs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className={cn(
                  'flex items-start gap-3 p-2.5 rounded-lg text-sm',
                  log.level === 'error' && 'bg-destructive/10',
                  log.level === 'warn' && 'bg-yellow-500/10',
                  log.event_type === 'Boot' && 'bg-green-500/10',
                  log.event_type === 'Shutdown' && 'bg-muted'
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getLogIcon(log.level, log.event_type)}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getLogBadgeVariant(log.event_type)} className="text-[10px] px-1.5 py-0">
                      {log.event_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="font-mono text-xs break-all whitespace-pre-wrap">
                    {log.event_message.trim()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export { EDGE_FUNCTIONS };
