import { formatPhone } from '../../utils/format';

/**
 * AtolyeTakip iç yardımcı fonksiyonları (Part 3 / P3.E1).
 *
 * Bu helper'lar AtolyeTakip.tsx içinden olduğu gibi taşındı; davranış
 * birebir aynı. Sub-component'ler (`AtolyeTableView`, `AtolyeCardView`,
 * `AtolyeStatusFilterBar`) bu modülden import eder.
 */

export const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return ''; }
};

// "-" fallback'ini koruyan ince adaptör (Part 3 / P3.G2 → E1).
// 11 hane → biçimli, diğer → input, boş → '-'.
export const formatPhoneNumber = (phone: string | null | undefined): string =>
  formatPhone(phone, '-');
