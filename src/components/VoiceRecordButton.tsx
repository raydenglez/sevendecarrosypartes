import { useState, useEffect } from 'react';
import { Mic, X, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface VoiceRecordButtonProps {
  onVoiceMessage: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export function VoiceRecordButton({ onVoiceMessage, disabled }: VoiceRecordButtonProps) {
  const { t } = useTranslation();
  const { isRecording, duration, startRecording, stopRecording, cancelRecording, error } = useVoiceRecorder();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await startRecording();
  };

  const handleStop = async () => {
    const blob = await stopRecording();
    if (blob && duration > 0) {
      onVoiceMessage(blob, duration);
    }
  };

  const handleCancel = () => {
    cancelRecording();
  };

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 flex-1 animate-in slide-in-from-right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="shrink-0 text-destructive hover:text-destructive"
        >
          <X className="w-5 h-5" />
        </Button>
        
        <div className="flex-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-sm font-medium text-destructive">
            {formatDuration(duration)}
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-destructive/60 transition-all duration-100"
              style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        <Button
          variant="carnetworx"
          size="icon"
          onClick={handleStop}
          className="shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleStart}
      disabled={disabled}
      className="shrink-0"
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
}
