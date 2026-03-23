import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mednote.ai',
  appName: 'MedNote AI',
  webDir: 'dist/public',
  server: {
    url: 'https://098b918f-8c03-405d-b6f6-d89ed3290933-00-3q3amhlze1ape.kirk.replit.dev',
    cleartext: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
