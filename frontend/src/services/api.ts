import axios, { InternalAxiosRequestConfig } from 'axios';
import { Islem, IslemCreateDto, IslemUpdateDto, FilterParams, SahaKayit, SahaKayitCreateDto, SahaKayitUpdateDto, SahaElemani } from '../types';

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
  (error) => {
    if (error.response?.status === 401) {
      // Token geçersiz, kullanıcıyı çıkış yap
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth servisleri
export const authService = {
  verifySystemPassword: async (password: string) => {
    const response = await api.post('/auth/verify-system-password', { password });
    return response.data;
  },

  register: async (username: string, password: string) => {
    const response = await api.post('/auth/register', { username, password });
    return response.data;
  },

  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  bayiLogin: async (username: string, password: string) => {
    const response = await api.post('/auth/bayi-login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  adminLogin: async (username: string, password: string) => {
    const response = await api.post('/admin/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// İşlem servisleri
export const islemService = {
  getAll: async (filters?: FilterParams & { page?: number; limit?: number; today?: string; yazdirilmamis?: string }): Promise<Islem[] | { data: Islem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const response = await api.get('/islemler', { params: filters });
    return response.data;
  },

  getStats: async (): Promise<{ total: string; acik: string; parca_bekliyor: string; tamamlandi: string; iptal: string; bugun: string; yazdirilmamis: string }> => {
    const response = await api.get('/islemler/stats');
    return response.data;
  },

  // Telefon numarasına göre arama (duplicate kontrolü için)
  searchByPhone: async (phone: string): Promise<Islem[]> => {
    const response = await api.get('/islemler/search-by-phone', { params: { phone } });
    return response.data;
  },

  // İsme göre müşteri geçmişi arama
  searchByName: async (name: string): Promise<Islem[]> => {
    const response = await api.get('/islemler/search-by-name', { params: { name } });
    return response.data;
  },

  create: async (data: IslemCreateDto): Promise<Islem> => {
    const response = await api.post('/islemler', data);
    return response.data;
  },

  update: async (id: number, data: IslemUpdateDto): Promise<Islem> => {
    const response = await api.put(`/islemler/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/islemler/${id}`);
  },

  updateDurum: async (id: number, is_durumu: 'acik' | 'tamamlandi'): Promise<Islem> => {
    const response = await api.patch(`/islemler/${id}/durum`, { is_durumu });
    return response.data;
  },
};

// Admin servisleri
export const adminService = {
  createUser: async (username: string, password: string) => {
    const response = await api.post('/admin/create-user', { username, password });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleUserStatus: async (id: number) => {
    const response = await api.patch(`/admin/users/${id}/toggle`);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  getUserRecords: async (username: string) => {
    const response = await api.get(`/admin/user-records/${username}`);
    return response.data;
  },

  getUserAtolyeRecords: async (username: string) => {
    const response = await api.get(`/admin/user-atolye-records/${username}`);
    return response.data;
  },

  getAllRecords: async (params?: { page?: number; limit?: number }): Promise<{ data: Islem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const response = await api.get('/admin/all-records', { params });
    return response.data;
  },
};

// Saha servisleri
export const sahaService = {
  // Saha elemanı girişi
  login: async (username: string, password: string) => {
    const response = await api.post('/saha/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Yeni saha elemanı oluştur (admin)
  createSahaElemani: async (username: string, password: string, ad_soyad?: string) => {
    const response = await api.post('/saha/create', { username, password, ad_soyad });
    return response.data;
  },

  // Tüm saha elemanlarını listele (admin)
  getSahaElemanlari: async (): Promise<SahaElemani[]> => {
    const response = await api.get('/saha/users');
    return response.data;
  },

  // Saha elemanı aktif/pasif yap (admin)
  toggleSahaElemaniStatus: async (id: number) => {
    const response = await api.patch(`/saha/users/${id}/toggle`);
    return response.data;
  },

  // Saha elemanı sil (admin)
  deleteSahaElemani: async (id: number) => {
    const response = await api.delete(`/saha/users/${id}`);
    return response.data;
  },

  // Yeni kayıt ekle (saha elemanı)
  createKayit: async (data: SahaKayitCreateDto): Promise<SahaKayit> => {
    const response = await api.post('/saha/kayit', data);
    return response.data.kayit;
  },

  // Kendi kayıtlarını getir (saha elemanı)
  getKayitlar: async (params?: { search?: string; startDate?: string; endDate?: string }): Promise<SahaKayit[]> => {
    const response = await api.get('/saha/kayitlar', { params });
    return response.data;
  },

  // Tek kayıt getir
  getKayit: async (id: number): Promise<SahaKayit> => {
    const response = await api.get(`/saha/kayit/${id}`);
    return response.data;
  },

  // Kayıt güncelle
  updateKayit: async (id: number, data: SahaKayitUpdateDto): Promise<SahaKayit> => {
    const response = await api.put(`/saha/kayit/${id}`, data);
    return response.data.kayit;
  },

  // Kayıt sil
  deleteKayit: async (id: number) => {
    const response = await api.delete(`/saha/kayit/${id}`);
    return response.data;
  },

  // Tüm saha kayıtlarını getir (admin) - foto_data hariç, paginated
  getAllKayitlar: async (params?: { search?: string; startDate?: string; endDate?: string; sahaElemaniId?: number; page?: number; limit?: number }): Promise<{ data: SahaKayit[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> => {
    const response = await api.get('/saha/all-kayitlar', { params, timeout: 60000 });
    return response.data;
  },

  // Tek kayıdın fotoğraflarını getir (lazy load)
  getKayitPhotos: async (id: number): Promise<string | null> => {
    const response = await api.get(`/saha/kayit-photos/${id}`, { timeout: 60000 });
    return response.data.foto_data;
  },

  // Saha elemanının kayıtlarını getir (admin)
  getUserKayitlar: async (username: string): Promise<SahaKayit[]> => {
    const response = await api.get(`/saha/user-kayitlar/${username}`);
    return response.data;
  },
};

export { api };
