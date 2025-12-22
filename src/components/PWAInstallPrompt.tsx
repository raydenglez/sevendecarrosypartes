import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import CarNexoLogo from '@/components/CarNexoLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

export const PWAInstallPrompt = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const dismissedDate = new Date(parseInt(dismissedAt, 10));
      const daysSinceDismiss = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < DISMISS_DAYS) {
        return;
      }
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Check if mobile
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    if (!isMobile) {
      return;
    }

    // For Android/Chrome, listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the prompt after a short delay
      setTimeout(() => setIsOpen(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show instructions after delay
    if (isIOSDevice) {
      setTimeout(() => setIsOpen(true), 3000);
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsOpen(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    } finally {
      setDeferredPrompt(null);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsOpen(false);
  };

  if (isInstalled) return null;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent className="pb-6">
        <DrawerHeader className="relative">
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <div className="flex flex-col items-center gap-4 pt-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-background shadow-lg border border-border flex items-center justify-center">
              <CarNexoLogo size="md" showIcon={true} animate={false} />
            </div>
            <div className="text-center">
              <DrawerTitle className="text-xl font-bold">
                {t('pwa.installTitle')}
              </DrawerTitle>
              <DrawerDescription className="mt-2 text-muted-foreground">
                {t('pwa.installDescription')}
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm">{t('pwa.benefit1')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-sm">{t('pwa.benefit2')}</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span className="text-sm">{t('pwa.benefit3')}</span>
            </div>
          </div>
        </div>

        <DrawerFooter className="px-6 gap-3">
          {isIOS ? (
            <div className="space-y-4">
              <p className="text-sm text-center text-muted-foreground font-medium">
                {t('pwa.iosInstructions')}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span>{t('pwa.iosStep1')}</span>
                <Share className="h-5 w-5 text-primary" />
                <span>{t('pwa.iosStep2')}</span>
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <Button variant="outline" className="w-full" onClick={handleDismiss}>
                {t('pwa.gotIt')}
              </Button>
            </div>
          ) : (
            <>
              <Button className="w-full" size="lg" onClick={handleInstall}>
                <Download className="h-5 w-5 mr-2" />
                {t('pwa.installButton')}
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleDismiss}>
                {t('pwa.notNow')}
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
