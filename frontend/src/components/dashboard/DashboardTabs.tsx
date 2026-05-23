import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import {
  Home,
  History,
  Build,
  Settings as SettingsIcon,
  AdminPanelSettings,
  Engineering,
} from '@mui/icons-material';

/**
 * DashboardTabs (Part 3 / P3.E2).
 *
 * Masaüstü tab şeridi. Saha gizli, bayi tek tab ("Atölye Takip"). Admin
 * → Ana Sayfa / Müşteri Geçmişi / Atölye Takip / Tanımlamalar / Yönetim / Saha.
 * Normal kullanıcı → ilk üçü + Saha (value=5). Tab `value` numaraları
 * orijinaliyle birebir aynı (Dashboard activeTab switch'ine bağımlı).
 */

export interface DashboardTabsProps {
  activeTab: number;
  onChange: (newValue: number) => void;
  isBayi: boolean;
  isSaha: boolean;
  isAdmin: boolean;
}

const tabSx = {
  minHeight: '42px',
  '& .MuiTab-root': {
    minHeight: '42px',
    py: 1,
    px: 3,
    fontSize: '0.85rem',
    textTransform: 'none' as const,
  },
};

const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onChange, isBayi, isSaha, isAdmin }) => {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', display: { xs: 'none', sm: isSaha ? 'none' : 'block' } }}>
      {isBayi ? (
        <Tabs value={0} sx={tabSx}>
          <Tab value={0} icon={<Build sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Atölye Takip" />
        </Tabs>
      ) : (
        <Tabs value={activeTab} onChange={(_, v) => onChange(v)} sx={tabSx}>
          <Tab value={0} icon={<Home sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Ana Sayfa" />
          <Tab value={1} icon={<History sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Müşteri Geçmişi" />
          <Tab value={2} icon={<Build sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Atölye Takip" />
          {isAdmin && <Tab value={3} icon={<SettingsIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Tanımlamalar" />}
          {isAdmin && <Tab value={4} icon={<AdminPanelSettings sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Yönetim" />}
          {isAdmin && <Tab value={5} icon={<Engineering sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Saha" />}
          {!isAdmin && !isBayi && !isSaha && (
            <Tab value={5} icon={<Engineering sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Saha" />
          )}
        </Tabs>
      )}
    </Box>
  );
};

export default DashboardTabs;
