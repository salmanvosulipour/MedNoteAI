import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mednote.ai',
  appName: 'MedNote AI',
  webDir: 'dist/public',
  server: {
    url: 'https://med-note-ai-1--salmanvosuli.replit.app',
    cleartext: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
