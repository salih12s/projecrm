/**
 * Socket.IO event isimleri — frontend ile birebir aynı string'ler.
 * Frontend karşılığı: frontend/src/constants/socketEvents.ts
 */
export const SOCKET_EVENTS = {
  YENI_ISLEM: 'yeni-islem',
  ISLEM_GUNCELLENDI: 'islem-guncellendi',
  ISLEM_SILINDI: 'islem-silindi',
  ISLEM_DURUM_DEGISTI: 'islem-durum-degisti',
  YENI_ATOLYE: 'yeni-atolye',
  ATOLYE_GUNCELLENDI: 'atolye-guncellendi',
  ATOLYE_SILINDI: 'atolye-silindi',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
