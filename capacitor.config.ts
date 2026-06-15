import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mednote.ai',
  appName: 'MedNote AI',
  webDir: 'dist/public',
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
