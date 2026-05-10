import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY  = 'pm_access_token';
const REFRESH_KEY = 'pm_refresh_token';

// expo-secure-store is not available on web — fall back to localStorage
const get = (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return Promise.resolve(localStorage.getItem(key));
  }
  return SecureStore.getItemAsync(key);
};

const set = (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
};

const remove = (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
};

const GENRE_PENDING_KEY = 'pm_genre_pending';

export const storage = {
  getAccessToken: () => get(ACCESS_KEY),
  setAccessToken: (token: string) => set(ACCESS_KEY, token),
  getRefreshToken: () => get(REFRESH_KEY),
  setRefreshToken: (token: string) => set(REFRESH_KEY, token),
  clearTokens: async () => {
    await remove(ACCESS_KEY);
    await remove(REFRESH_KEY);
  },
  getGenrePending: () => get(GENRE_PENDING_KEY),
  setGenrePending: () => set(GENRE_PENDING_KEY, 'true'),
  clearGenrePending: () => remove(GENRE_PENDING_KEY),
};
