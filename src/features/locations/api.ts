import { api } from '@/lib/api';

export interface LocationResult {
  name: string;
  district: string;
  city: string;
  fullAddress: string;
}

export const locationApi = {
  search: (query: string) =>
    api
      .get<{ data: LocationResult[] }>('/locations/search', { params: { query } })
      .then((r) => r.data.data),

  reverseGeocode: (lat: number, lng: number) =>
    api
      .get<{ data: LocationResult | null }>('/locations/reverse-geocode', { params: { lat, lng } })
      .then((r) => r.data.data),
};
