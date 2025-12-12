import { MapPin } from 'lucide-react';
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
          <DialogTitle className="text-xl">Enable Location</DialogTitle>
          <DialogDescription className="text-center pt-2">
            The app improves its results with your location. Enable GPS to discover vehicles, parts, and services near you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="carnexo" className="w-full" onClick={handleRetry}>
            Enable Location
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
