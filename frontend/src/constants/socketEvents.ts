/**
 * Socket.IO event isimleri — backend ile birebir aynı string'ler.
 * Buradaki değerleri DEĞİŞTİRMEYİN; karşılığı backend/src/constants/socketEvents.ts'de tutulur.
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
