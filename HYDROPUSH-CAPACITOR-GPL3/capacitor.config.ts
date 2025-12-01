import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hydropush.app',
  appName: 'hydropush-app',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: "#1E88E5",
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_droplets",
      iconColor: "#488AFF",
    },
  },
};

export default config;
