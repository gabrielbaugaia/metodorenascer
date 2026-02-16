import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.renascer.connect',
  appName: 'Renascer Connect',
  webDir: 'dist',
  server: {
    url: 'https://a75d46a2-4cbd-4416-81c4-9988ca4fb176.lovableproject.com/connect/login?forceHideBadge=true',
    cleartext: false
  }
};

export default config;
