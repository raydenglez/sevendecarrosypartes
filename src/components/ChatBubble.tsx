import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isSent: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export function ChatBubble({ content, timestamp, isSent, status }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex",
        isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] px-4 py-2.5 rounded-2xl",
          isSent 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-card text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed break-words">{content}</p>
        <div className={cn(
          "flex items-center justify-end gap-1 mt-1",
          isSent ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="text-[10px]">
            {format(new Date(timestamp), 'HH:mm')}
          </span>
          {isSent && status && (
            status === 'read' ? (
              <CheckCheck className="w-3.5 h-3.5" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
