import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Code, 
  FileText, 
  Database, 
  Terminal, 
  Download, 
  Table, 
  Eye,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { generateApiDocs, getApiDocsFilename } from '@/lib/generateApiDocs';
import { getDatabaseSchema, type TableSchema } from '@/lib/schemaParser';
import { EdgeFunctionLogs, EDGE_FUNCTIONS } from '@/components/admin/EdgeFunctionLogs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Mock logs data structure - in production this would come from Supabase analytics
interface LogEntry {
  event_message: string;
  event_type: string;
  level: 'log' | 'info' | 'warn' | 'error';
  timestamp: number;
}

export default function DeveloperTools() {
  const [logs, setLogs] = useState<Record<string, LogEntry[]>>({});
  const [logsLoading, setLogsLoading] = useState(false);
  const [downloadingDocs, setDownloadingDocs] = useState(false);

  const schema = getDatabaseSchema();

  const downloadDocumentation = useCallback(() => {
    setDownloadingDocs(true);
    try {
      const content = generateApiDocs();
      const filename = getApiDocsFilename();
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingDocs(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      // Fetch logs for all edge functions
      const logsData: Record<string, LogEntry[]> = {};
      
      // For demo purposes, we'll show the logs that are available in the context
      // In production, this would fetch from Supabase analytics
      const mockLogs: Record<string, LogEntry[]> = {
        'process-scheduled-notifications': [
          { event_message: 'No scheduled notifications due', event_type: 'Log', level: 'info', timestamp: Date.now() * 1000 },
          { event_message: 'Checking for scheduled notifications...', event_type: 'Log', level: 'info', timestamp: (Date.now() - 1000) * 1000 },
          { event_message: 'booted (time: 93ms)', event_type: 'Boot', level: 'log', timestamp: (Date.now() - 2000) * 1000 },
        ],
        'get-vapid-key': [
          { event_message: 'shutdown', event_type: 'Shutdown', level: 'log', timestamp: Date.now() * 1000 },
          { event_message: 'Listening on http://localhost:9999/', event_type: 'Log', level: 'info', timestamp: (Date.now() - 1000) * 1000 },
          { event_message: 'booted (time: 23ms)', event_type: 'Boot', level: 'log', timestamp: (Date.now() - 2000) * 1000 },
        ],
      };

      setLogs(mockLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'uuid':
        return 'text-purple-500';
      case 'string':
        return 'text-green-500';
      case 'number':
        return 'text-blue-500';
      case 'boolean':
        return 'text-yellow-500';
      case 'timestamp':
        return 'text-orange-500';
      case 'json':
        return 'text-pink-500';
      default:
        if (type.endsWith('[]')) return 'text-cyan-500';
        return 'text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            Developer Tools
          </h1>
          <p className="text-muted-foreground mt-1">
            API documentation, database schema reference, and function logs
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                API Documentation
              </CardTitle>
              <CardDescription>
                Download complete API documentation for mobile development with RorkAI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    App overview & user flows
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Database connection credentials
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Complete schema reference (18 tables)
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Edge Function API specs (7 endpoints)
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Authentication & query examples
                  </li>
                </ul>
              </div>
              <Button 
                onClick={downloadDocumentation} 
                className="w-full gap-2"
                disabled={downloadingDocs}
              >
                {downloadingDocs ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Documentation (.md)
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Overview
              </CardTitle>
              <CardDescription>
                Quick summary of your database structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{schema.tables.length}</p>
                  <p className="text-xs text-muted-foreground">Tables</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{schema.views.length}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{schema.enums.length}</p>
                  <p className="text-xs text-muted-foreground">Enums</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {schema.enums.slice(0, 6).map((enumType) => (
                  <Badge key={enumType.name} variant="outline" className="text-xs">
                    {enumType.name}
                  </Badge>
                ))}
                {schema.enums.length > 6 && (
                  <Badge variant="secondary" className="text-xs">
                    +{schema.enums.length - 6} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Database Schema
            </CardTitle>
            <CardDescription>
              Explore all tables, views, and their columns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="space-y-2">
              {/* Tables */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Tables ({schema.tables.length})
                </h3>
                {schema.tables.map((table) => (
                  <AccordionItem 
                    key={table.name} 
                    value={table.name}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{table.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {table.columns.length} cols
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="max-h-[300px]">
                        <div className="space-y-1 pb-2">
                          {table.columns.map((col) => (
                            <div 
                              key={col.name}
                              className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 font-mono text-xs"
                            >
                              <span className="flex items-center gap-2">
                                {col.name}
                                {!col.nullable && (
                                  <span className="text-destructive text-[10px]">*</span>
                                )}
                              </span>
                              <span className={cn('text-[10px]', getTypeColor(col.type))}>
                                {col.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>

              {/* Views */}
              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Views ({schema.views.length})
                </h3>
                {schema.views.map((view) => (
                  <AccordionItem 
                    key={view.name} 
                    value={view.name}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{view.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          view
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pb-2">
                        {view.columns.map((col) => (
                          <div 
                            key={col.name}
                            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 font-mono text-xs"
                          >
                            <span>{col.name}</span>
                            <span className={cn('text-[10px]', getTypeColor(col.type))}>
                              {col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </div>
            </Accordion>
          </CardContent>
        </Card>

        {/* Edge Function Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Edge Function Logs
            </CardTitle>
            <CardDescription>
              View recent execution logs for backend functions ({EDGE_FUNCTIONS.length} functions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EdgeFunctionLogs 
              logs={logs} 
              isLoading={logsLoading} 
              onRefresh={fetchLogs} 
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
