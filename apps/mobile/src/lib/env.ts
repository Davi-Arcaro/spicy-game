import Constants from 'expo-constants';

interface Extra {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

if (!extra.supabaseUrl) {
  console.warn(
    '[env] supabaseUrl missing. Set EXPO_PUBLIC_SUPABASE_URL or default to local supabase.'
  );
}

export const env = {
  supabaseUrl: extra.supabaseUrl ?? 'http://127.0.0.1:54321',
  supabaseAnonKey: extra.supabaseAnonKey ?? '',
};
