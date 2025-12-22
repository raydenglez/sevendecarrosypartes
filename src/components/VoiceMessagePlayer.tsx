import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  isSent: boolean;
}

export function VoiceMessagePlayer({ url, duration = 0, isSent }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(Math.floor(audio.currentTime));
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    });

    audio.addEventListener('loadedmetadata', () => {
      // Update duration if not provided
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayDuration = duration || (audioRef.current?.duration ? Math.floor(audioRef.current.duration) : 0);

  return (
    <div className="flex items-center gap-2 min-w-[160px]">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "shrink-0 w-8 h-8",
          isSent 
            ? "text-primary-foreground hover:bg-primary-foreground/20" 
            : "text-foreground hover:bg-muted"
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1">
        <div className={cn(
          "h-1 rounded-full overflow-hidden",
          isSent ? "bg-primary-foreground/30" : "bg-muted"
        )}>
          <div 
            className={cn(
              "h-full transition-all duration-100",
              isSent ? "bg-primary-foreground" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={cn(
          "text-[10px]",
          isSent ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {isPlaying ? formatTime(currentTime) : formatTime(displayDuration)}
        </span>
      </div>
    </div>
  );
}
