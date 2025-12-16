import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function LocationPermissionModal({ isOpen, onClose, onRetry }: LocationPermissionModalProps) {
  const { t } = useTranslation();

  const handleRetry = () => {
    onRetry();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">{t('locationPermission.title')}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t('locationPermission.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="carnexo" className="w-full" onClick={handleRetry}>
            {t('locationPermission.enable')}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            {t('locationPermission.maybeLater')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}