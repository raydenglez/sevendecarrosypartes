import { cn } from '@/lib/utils';
import { Check, CheckCheck, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { ImageViewer } from './ImageViewer';

type MessageType = 'text' | 'image' | 'voice';

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isSent: boolean;
  status?: 'sent' | 'delivered' | 'read';
  messageType?: MessageType;
  mediaUrl?: string | null;
  mediaDuration?: number | null;
}

export function ChatBubble({ 
  content, 
  timestamp, 
  isSent, 
  status,
  messageType = 'text',
  mediaUrl,
  mediaDuration,
}: ChatBubbleProps) {
  const [imageExpanded, setImageExpanded] = useState(false);

  const renderContent = () => {
    switch (messageType) {
      case 'image':
        return (
          <>
            <img 
              src={mediaUrl || ''} 
              alt="Shared image"
              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setImageExpanded(true)}
            />
            {content && <p className="text-sm leading-relaxed break-words mt-2">{content}</p>}
          </>
        );
      
      case 'voice':
        return (
          <VoiceMessagePlayer 
            url={mediaUrl || ''} 
            duration={mediaDuration || 0}
            isSent={isSent}
          />
        );
      
      default:
        return <p className="text-sm leading-relaxed break-words">{content}</p>;
    }
  };

  return (
    <>
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
              : "bg-card text-foreground rounded-bl-md",
            messageType === 'image' && "p-2"
          )}
        >
          {renderContent()}
          <div className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isSent ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {messageType === 'voice' && (
              <Mic className="w-3 h-3" />
            )}
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

      {/* Full screen image viewer with zoom */}
      {messageType === 'image' && mediaUrl && (
        <ImageViewer
          images={[mediaUrl]}
          isOpen={imageExpanded}
          onClose={() => setImageExpanded(false)}
          alt="Shared image"
        />
      )}
    </>
  );
}
