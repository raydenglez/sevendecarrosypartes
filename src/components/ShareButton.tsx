import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Check, Copy, Link, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { openExternalUrl } from '@/lib/externalUrl';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'icon';
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  variant = 'ghost',
  size = 'icon',
  className,
}: ShareButtonProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const shareUrl = url || window.location.href;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        // Fallback to copy
        handleCopyLink();
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('share.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('share.copyFailed'));
    }
  };

  const handleWhatsAppShare = async () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${shareUrl}`)}`;
    await openExternalUrl(whatsappUrl);
  };

  // Use native share if available
  if (navigator.share) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
      >
        {copied ? (
          <Check className="w-5 h-5 text-success" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
      </Button>
    );
  }

  // Fallback dropdown for browsers without native share
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {copied ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <Share2 className="w-5 h-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-success" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {t('share.copyLink')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare}>
          <MessageCircle className="w-4 h-4 mr-2" />
          {t('share.whatsapp')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
