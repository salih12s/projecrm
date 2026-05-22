import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Environment variable'dan API URL'i al
// Development: http://localhost:5000/api
// Production: /api (aynı domain)
// Local + Production API: .env.local dosyasında override edilebilir
const API_URL = import.meta.env.VITE_API_URL || '/api';

console.log('API URL:', API_URL); // Debug için

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableAxiosConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
};

const RETRYABLE_GET_STATUS_CODES = new Set([500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetryGetRequest(error: AxiosError): boolean {
  const config = error.config as RetryableAxiosConfig | undefined;
  const method = config?.method?.toLowerCase();
  const status = error.response?.status;
  const retryCount = config?._retryCount || 0;

  if (!config || method !== 'get' || retryCount >= 2) {
    return false;
  }

  return !status || RETRYABLE_GET_STATUS_CODES.has(status) || error.code === 'ECONNABORTED';
}

// Token'ı her istekte ekle
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı çıkış yap
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (shouldRetryGetRequest(error)) {
      const config = error.config as RetryableAxiosConfig;
      config._retryCount = (config._retryCount || 0) + 1;
      await sleep(500 * config._retryCount);
      return api(config);
    }

    return Promise.reject(error);
  }
);

export { api };

// Re-export servisleri — mevcut import path'leri (`from '../services/api'`) bozulmasın diye.
// Servis fonksiyonlarının gerçek implementasyonu ayrı dosyalarda:
//   - ./auth.service.ts
//   - ./islem.service.ts
//   - ./admin.service.ts
//   - ./saha.service.ts
//   - ./karaliste.service.ts
//   - ./marka.service.ts
//   - ./teknisyen.service.ts
//   - ./montaj.service.ts
//   - ./aksesuar.service.ts
//   - ./urun.service.ts
//   - ./bayi.service.ts
//   - ./location.service.ts
//   - ./atolye.service.ts
//   - ./printerSettings.service.ts
export { authService } from './auth.service';
export { islemService } from './islem.service';
export { adminService } from './admin.service';
export { sahaService } from './saha.service';
export { karalisteService } from './karaliste.service';
export { markaService } from './marka.service';
export { teknisyenService } from './teknisyen.service';
export { montajService } from './montaj.service';
export { aksesuarService } from './aksesuar.service';
export { urunService } from './urun.service';
export { bayiService } from './bayi.service';
export { locationService } from './location.service';
export { atolyeService } from './atolye.service';
export { printerSettingsService } from './printerSettings.service';
