import { useState } from 'react';
import { MapPin, Settings } from 'lucide-react';
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
  const [isDenied, setIsDenied] = useState(false);

  const handleRetry = () => {
    // Directly call geolocation API to trigger the native permission prompt
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Success - permission granted, trigger the refresh
          onRetry();
          setIsDenied(false);
          onClose();
        },
        (error) => {
          // User denied or error
          if (error.code === error.PERMISSION_DENIED) {
            setIsDenied(true);
          } else {
            onClose();
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    setIsDenied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {isDenied ? (
              <Settings className="w-8 h-8 text-muted-foreground" />
            ) : (
              <MapPin className="w-8 h-8 text-primary" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {isDenied ? t('locationPermission.deniedTitle') : t('locationPermission.title')}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {isDenied ? t('locationPermission.deniedDescription') : t('locationPermission.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isDenied ? (
            <Button variant="ghost" className="w-full" onClick={handleClose}>
              {t('locationPermission.understood')}
            </Button>
          ) : (
            <>
              <Button variant="carnetworx" className="w-full" onClick={handleRetry}>
                {t('locationPermission.enable')}
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleClose}>
                {t('locationPermission.maybeLater')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}