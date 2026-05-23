import React from 'react';
import { Box, Button } from '@mui/material';

/**
 * AtolyeStatusFilterBar (Part 3 / P3.E1).
 *
 * AtolyeTakip içinden olduğu gibi taşınan 7 buton: Tümü / Beklemede /
 * Teslim Edildi / Sipariş Verildi / Yapıldı / Fabrika Gitti / Ödeme
 * Bekliyor. Renkler, hover stilleri, "yan yana ad + (sayı)" düzeni
 * orijinaliyle birebir aynı.
 *
 * `getStatusCount('all' | <status>)` çağrısı ile sayı parent'tan alınır;
 * iç state tutmaz.
 */

export interface AtolyeStatusFilterBarProps {
  activeStatusFilter: string;
  onChange: (status: string) => void;
  getStatusCount: (status: string) => number;
}

interface StatusBtn {
  value: string;
  label: string;
  color: string;
  hover: string;
  countKey: string;
}

const BUTTONS: StatusBtn[] = [
  { value: '',                label: 'Tümü',           color: '#0D3282', hover: '#0a2566', countKey: 'all' },
  { value: 'beklemede',       label: 'Beklemede',      color: '#ff9800', hover: '#f57c00', countKey: 'beklemede' },
  { value: 'teslim_edildi',   label: 'Teslim Edildi',  color: '#0288d1', hover: '#01579b', countKey: 'teslim_edildi' },
  { value: 'siparis_verildi', label: 'Sipariş Verildi', color: '#9c27b0', hover: '#7b1fa2', countKey: 'siparis_verildi' },
  { value: 'yapildi',         label: 'Yapıldı',        color: '#8bc34a', hover: '#689f38', countKey: 'yapildi' },
  { value: 'fabrika_gitti',   label: 'Fabrika Gitti',  color: '#9e9e9e', hover: '#757575', countKey: 'fabrika_gitti' },
  { value: 'odeme_bekliyor',  label: 'Ödeme Bekliyor', color: '#f44336', hover: '#d32f2f', countKey: 'odeme_bekliyor' },
];

const AtolyeStatusFilterBar: React.FC<AtolyeStatusFilterBarProps> = ({
  activeStatusFilter,
  onChange,
  getStatusCount,
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {BUTTONS.map((b) => {
        const active = activeStatusFilter === b.value;
        // rgba hover renkleri orijinaldeki sabitlerle birebir aynı tutuluyor
        // (renk paleti değişmesin diye literal listeden alınıyor).
        const hoverInactive =
          b.value === ''                ? 'rgba(13, 50, 130, 0.1)' :
          b.value === 'beklemede'       ? 'rgba(255, 152, 0, 0.1)' :
          b.value === 'teslim_edildi'   ? 'rgba(2, 136, 209, 0.1)' :
          b.value === 'siparis_verildi' ? 'rgba(156, 39, 176, 0.1)' :
          b.value === 'yapildi'         ? 'rgba(139, 195, 74, 0.1)' :
          b.value === 'fabrika_gitti'   ? 'rgba(158, 158, 158, 0.1)' :
                                          'rgba(244, 67, 54, 0.1)';
        return (
          <Button
            key={b.value || 'all'}
            variant={active ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onChange(b.value)}
            sx={{
              backgroundColor: active ? b.color : 'transparent',
              color: active ? 'white' : b.color,
              borderColor: b.color,
              '&:hover': {
                backgroundColor: active ? b.hover : hoverInactive,
              },
              display: 'flex',
              flexDirection: 'column',
              gap: 0.3,
              py: 0.5,
            }}
          >
            <span>{b.label}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>({getStatusCount(b.countKey)})</span>
          </Button>
        );
      })}
    </Box>
  );
};

export default AtolyeStatusFilterBar;
