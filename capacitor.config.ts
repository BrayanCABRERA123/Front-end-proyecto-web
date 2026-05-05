import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miapp.app',
  appName: 'MiApp',
  webDir: 'dist/web/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;