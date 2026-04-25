import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'pm_access_token';
const REFRESH_KEY = 'pm_refresh_token';

export const storage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  setAccessToken: (token: string) => SecureStore.setItemAsync(ACCESS_KEY, token),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  setRefreshToken: (token: string) => SecureStore.setItemAsync(REFRESH_KEY, token),
  clearTokens: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
