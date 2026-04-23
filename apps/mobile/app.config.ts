import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Spicy',
  slug: 'spicy-game',
  scheme: 'spicy',
  version: '0.0.1',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0C0906',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.spicygame.app',
  },
  android: {
    package: 'com.spicygame.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0C0906',
    },
  },
  plugins: ['expo-font', 'expo-av'],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  experiments: {
    typedRoutes: false,
  },
};

export default config;
