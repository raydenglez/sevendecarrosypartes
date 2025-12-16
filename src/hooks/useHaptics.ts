import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const trigger = useCallback(async (style: HapticStyle = 'light') => {
    // Try Capacitor Haptics first (for native apps)
    try {
      const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
      
      switch (style) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'selection':
          await Haptics.selectionStart();
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
      return;
    } catch {
      // Capacitor not available, try web vibration API
    }

    // Fallback to Web Vibration API
    if ('vibrate' in navigator) {
      const patterns: Record<HapticStyle, number | number[]> = {
        light: 10,
        medium: 25,
        heavy: 50,
        selection: 5,
        success: [10, 50, 10],
        warning: [25, 50, 25],
        error: [50, 50, 50],
      };
      navigator.vibrate(patterns[style]);
    }
  }, []);

  const selectionChanged = useCallback(async () => {
    try {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.selectionChanged();
    } catch {
      if ('vibrate' in navigator) {
        navigator.vibrate(3);
      }
    }
  }, []);

  return { trigger, selectionChanged };
}
