import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8db981fe6fc141c8812378be2661e81a',
  appName: 'CarNexo',
  webDir: 'dist',
  server: {
    url: 'https://8db981fe-6fc1-41c8-8123-78be2661e81a.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
