import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Opens an external URL properly for both web and native platforms.
 * On native platforms, uses Capacitor Browser plugin to open in-app browser.
 * On web, uses window.open for a new tab.
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
};

/**
 * Gets the appropriate redirect URL for OAuth and email confirmations.
 * Uses deep link scheme for native apps, window origin for web.
 */
export const getAuthRedirectUrl = (path: string = '/'): string => {
  if (Capacitor.isNativePlatform()) {
    return `app.carnetworx://${path}`;
  }
  return `${window.location.origin}${path}`;
};
