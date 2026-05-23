import React from 'react';
import { Box, Button, Typography } from '@mui/material';

/**
 * DashboardStatsBar (Part 3 / P3.E2).
 *
 * Ana Sayfa üst satırı: "İşlemler" başlığı + 5 durum butonu + Yazdırılmamış
 * + Bugün alınan + clear (×). Renkler ve hover state'leri legacy ile
 * birebir; data-driven yapı sayesinde geniş JSX bloku ortadan kalktı,
 * davranış aynı.
 */

export type StatusFilter = 'all' | 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';

export interface DashboardStats {
  totalCount: number;
  acikCount: number;
  parcaBekleCount: number;
  tamamlandiCount: number;
  iptalCount: number;
  yazdirilmamisCount: number;
  bugunCount: number;
}

export interface DashboardStatsBarProps {
  stats: DashboardStats;
  statusFilter: StatusFilter;
  showTodayOnly: boolean;
  showYazdirilmamis: boolean;
  onStatusFilterClick: (filter: StatusFilter) => void;
  onTodayFilter: () => void;
  onYazdirilmamisFilter: () => void;
  onClearDateFilters: () => void;
}

interface StatBtn {
  filter: StatusFilter;
  label: string;
  count: keyof DashboardStats;
  bg: string;
  bgHover: string;
  bgInactiveHover: string;
}

const STATUS_BUTTONS: StatBtn[] = [
  { filter: 'all',            label: 'Toplam',          count: 'totalCount',         bg: '#0D3282', bgHover: '#0a2461', bgInactiveHover: 'rgba(13, 50, 130, 0.04)' },
  { filter: 'acik',           label: 'Açık',            count: 'acikCount',          bg: '#ed6c02', bgHover: '#e65100', bgInactiveHover: 'rgba(237, 108, 2, 0.04)' },
  { filter: 'parca_bekliyor', label: 'Parça Bekliyor',  count: 'parcaBekleCount',    bg: '#1976d2', bgHover: '#1565c0', bgInactiveHover: 'rgba(25, 118, 210, 0.04)' },
  { filter: 'tamamlandi',     label: 'Tamamlanan',      count: 'tamamlandiCount',    bg: '#2e7d32', bgHover: '#1b5e20', bgInactiveHover: 'rgba(46, 125, 50, 0.04)' },
  { filter: 'iptal',          label: 'İptal',           count: 'iptalCount',         bg: '#d32f2f', bgHover: '#c62828', bgInactiveHover: 'rgba(211, 47, 47, 0.04)' },
];

const buttonSx = (active: boolean, bg: string, bgHover: string, bgInactiveHover: string) => ({
  fontSize: '0.6rem',
  py: 0.25,
  px: 0.6,
  minWidth: 'auto',
  bgcolor: active ? bg : 'transparent',
  color: active ? '#fff' : bg,
  borderColor: bg,
  '&:hover': {
    bgcolor: active ? bgHover : bgInactiveHover,
  },
});

const DashboardStatsBar: React.FC<DashboardStatsBarProps> = ({
  stats,
  statusFilter,
  showTodayOnly,
  showYazdirilmamis,
  onStatusFilterClick,
  onTodayFilter,
  onYazdirilmamisFilter,
  onClearDateFilters,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexWrap: 'nowrap', overflowX: 'auto' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.9rem', mr: 0.5 }}>
        İşlemler
      </Typography>

      {STATUS_BUTTONS.map((b) => {
        const active = statusFilter === b.filter;
        return (
          <Button
            key={b.filter}
            variant={active ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onStatusFilterClick(b.filter)}
            sx={buttonSx(active, b.bg, b.bgHover, b.bgInactiveHover)}
          >
            {b.label}: {stats[b.count]}
          </Button>
        );
      })}

      {/* Yazdırılmamış İşler Filtresi */}
      <Button
        variant={showYazdirilmamis ? 'contained' : 'outlined'}
        size="small"
        onClick={onYazdirilmamisFilter}
        sx={buttonSx(showYazdirilmamis, '#9c27b0', '#7b1fa2', 'rgba(156, 39, 176, 0.04)')}
      >
        Yazdırılmamış iş: {stats.yazdirilmamisCount}
      </Button>

      {/* Bugün Alınan İşler */}
      <Button
        variant={showTodayOnly ? 'contained' : 'outlined'}
        size="small"
        onClick={onTodayFilter}
        sx={{
          fontSize: '0.6rem',
          py: 0.25,
          px: 0.6,
          minWidth: 'auto',
          color: showTodayOnly ? '#fff' : '#2C3E82',
          borderColor: '#2C3E82',
          bgcolor: showTodayOnly ? '#2C3E82' : 'transparent',
          '&:hover': {
            borderColor: '#1a2850',
            bgcolor: showTodayOnly ? '#1a2850' : 'rgba(44, 62, 130, 0.04)',
          },
        }}
      >
        Bugün alınan iş: {stats.bugunCount}
      </Button>

      {showTodayOnly && (
        <Button
          variant="text"
          size="small"
          onClick={onClearDateFilters}
          sx={{ fontSize: '0.65rem', py: 0.3, px: 0.5, minWidth: 'auto', color: '#2C3E82' }}
        >
          ✕
        </Button>
      )}
    </Box>
  );
};

export default DashboardStatsBar;
