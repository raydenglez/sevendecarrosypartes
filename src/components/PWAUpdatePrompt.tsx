import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export const PWAUpdatePrompt = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast(
        'A new version is available!',
        {
          description: 'Click update to get the latest features and fixes.',
          duration: Infinity,
          icon: <img src={logo} alt="" className="h-5 w-5 rounded" />,
          action: {
            label: 'Update Now',
            onClick: () => updateServiceWorker(true),
          },
          cancel: {
            label: 'Later',
            onClick: () => {},
          },
        }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};
