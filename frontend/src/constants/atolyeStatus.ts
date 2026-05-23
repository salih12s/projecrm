/**
 * Atölye teslim durumu sabitleri.
 * Backend ile aynı string'leri kullanır; DEĞER değişikliği API kontratını bozar.
 *
 * AtolyeTakip.tsx içinde tekrarlanan getStatusColor / getStatusLabel /
 * getRowBackgroundColor helper'larının single-source-of-truth versiyonu.
 */

export type AtolyeStatus =
  | 'teslim_edildi'
  | 'beklemede'
  | 'siparis_verildi'
  | 'yapildi'
  | 'fabrika_gitti'
  | 'odeme_bekliyor';

export type AtolyeChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export const ATOLYE_STATUS_LABEL: Record<AtolyeStatus, string> = {
  teslim_edildi: 'Teslim Edildi',
  beklemede: 'Beklemede',
  siparis_verildi: 'Sipariş Verildi',
  yapildi: 'Yapıldı',
  fabrika_gitti: 'Fabrika Gitti',
  odeme_bekliyor: 'Ödeme Bekliyor',
};

export const ATOLYE_STATUS_COLOR: Record<AtolyeStatus, AtolyeChipColor> = {
  teslim_edildi: 'info',
  beklemede: 'warning',
  siparis_verildi: 'secondary',
  yapildi: 'success',
  fabrika_gitti: 'default',
  odeme_bekliyor: 'error',
};

export const ATOLYE_STATUS_BG_COLOR: Record<AtolyeStatus, string> = {
  teslim_edildi: '#b3e5fc',
  beklemede: '#ffe0b2',
  siparis_verildi: '#e1bee7',
  yapildi: '#dcedc8',
  fabrika_gitti: '#e0e0e0',
  odeme_bekliyor: '#ffcdd2',
};

const STATUS_SET = new Set<string>(Object.keys(ATOLYE_STATUS_LABEL));

export const isAtolyeStatus = (value: string): value is AtolyeStatus =>
  STATUS_SET.has(value);

export const getAtolyeStatusLabel = (status: string): string =>
  isAtolyeStatus(status) ? ATOLYE_STATUS_LABEL[status] : status;

export const getAtolyeStatusColor = (status: string): AtolyeChipColor =>
  isAtolyeStatus(status) ? ATOLYE_STATUS_COLOR[status] : 'default';

export const getAtolyeRowBackgroundColor = (status: string): string =>
  isAtolyeStatus(status) ? ATOLYE_STATUS_BG_COLOR[status] : 'transparent';
