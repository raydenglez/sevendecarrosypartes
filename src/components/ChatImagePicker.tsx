import { useRef, useState } from 'react';
import { Image as ImageIcon, Camera, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatImagePickerProps {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function ChatImagePicker({ onImageSelected, disabled }: ChatImagePickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image before sending
      compressImage(file).then(compressedFile => {
        onImageSelected(compressedFile);
      });
    }
    // Reset input
    e.target.value = '';
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Max dimensions
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
            <Camera className="w-4 h-4 mr-2" />
            {t('chat.takePhoto')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="w-4 h-4 mr-2" />
            {t('chat.chooseFromGallery')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

interface ImagePreviewProps {
  file: File;
  onCancel: () => void;
  onSend: () => void;
  sending?: boolean;
}

export function ChatImagePreview({ file, onCancel, onSend, sending }: ImagePreviewProps) {
  const { t } = useTranslation();
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onCancel} disabled={sending}>
          <X className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium">{t('chat.sendImage')}</span>
        <Button 
          variant="carnetworx" 
          size="sm" 
          onClick={onSend}
          disabled={sending}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('chat.send')}
        </Button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img 
          src={previewUrl} 
          alt="Preview" 
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
