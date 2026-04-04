import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.conniku.app',
  appName: 'Conniku',
  webDir: 'dist/renderer',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.conniku.com',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#151B1E',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#151B1E',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      permissions: ['camera', 'photos'],
    },
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Conniku',
    backgroundColor: '#151B1E',
    limitsNavigationsToAppBoundDomains: true,
  },
  android: {
    backgroundColor: '#151B1E',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
