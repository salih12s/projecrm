import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Home,
  History,
  Build,
  Settings as SettingsIcon,
  AdminPanelSettings,
  Engineering,
} from '@mui/icons-material';

/**
 * DashboardDrawer (Part 3 / P3.E2).
 *
 * Sadece admin için (isBayi/isSaha hariç) sol-açılır mobil drawer.
 * menuItems içeriği rol bazlı (admin → Tanımlamalar/Yönetim/Saha).
 */

export interface DashboardMenuItem {
  label: string;
  icon: React.ReactNode;
  index: number;
}

export const buildDashboardMenuItems = (isAdmin: boolean): DashboardMenuItem[] => [
  { label: 'Ana Sayfa',         icon: <Home />,                index: 0 },
  { label: 'Müşteri Geçmişi',   icon: <History />,             index: 1 },
  { label: 'Atölye Takip',      icon: <Build />,               index: 2 },
  ...(isAdmin
    ? [
        { label: 'Tanımlamalar', icon: <SettingsIcon />,           index: 3 },
        { label: 'Yönetim',      icon: <AdminPanelSettings />,     index: 4 },
        { label: 'Saha',         icon: <Engineering />,            index: 5 },
      ]
    : []),
];

export interface DashboardDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: number;
  isAdmin: boolean;
  onNavigate: (tabIndex: number) => void;
}

const DashboardDrawer: React.FC<DashboardDrawerProps> = ({ open, onClose, activeTab, isAdmin, onNavigate }) => {
  const menuItems = buildDashboardMenuItems(isAdmin);
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': { width: 240 },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.index}
            selected={activeTab === item.index}
            onClick={() => onNavigate(item.index)}
            sx={{
              '&.Mui-selected': { bgcolor: 'rgba(44, 62, 130, 0.1)' },
            }}
          >
            <ListItemIcon sx={{ color: activeTab === item.index ? '#2C3E82' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default DashboardDrawer;
