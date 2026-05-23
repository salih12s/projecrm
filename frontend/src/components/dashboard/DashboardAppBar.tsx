import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem, Divider, Box } from '@mui/material';
import {
  Build,
  Engineering,
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
} from '@mui/icons-material';

/**
 * DashboardAppBar (Part 3 / P3.E2).
 *
 * Üst bar: hamburger menu (sadece admin/normal mobilde), başlık,
 * isAdmin için TOPLAM TUTAR badge'i, tarih, kullanıcı avatar + menü.
 *
 * Tüm renkler, sx prop'ları, koşullu render kuralları orijinaliyle birebir.
 */

export interface DashboardAppBarProps {
  isMobile: boolean;
  isAdmin: boolean;
  isBayi: boolean;
  isSaha: boolean;
  username?: string | null;
  toplamTutar: number;
  onDrawerToggle: () => void;
  onLogout: () => void;
}

const DashboardAppBar: React.FC<DashboardAppBarProps> = ({
  isMobile,
  isAdmin,
  isBayi,
  isSaha,
  username,
  toplamTutar,
  onDrawerToggle,
  onLogout,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogoutFromMenu = () => {
    handleMenuClose();
    onLogout();
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#2C3E82' }}>
      <Toolbar sx={{ minHeight: '48px !important', px: 2 }}>
        {/* Mobilde hamburger menu (sadece admin için, saha ve bayi hariç) */}
        {isMobile && !isBayi && !isSaha && (
          <IconButton color="inherit" edge="start" onClick={onDrawerToggle} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
        )}
        {isSaha ? (
          <>
            <Engineering sx={{ mr: 1, fontSize: '1.5rem' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              Saha Paneli
            </Typography>
          </>
        ) : (
          <>
            <Build sx={{ mr: 1, fontSize: '1.5rem' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              Teknik Servis - Ana Sayfa
            </Typography>
          </>
        )}

        {/* Toplam Tutar - Header'da büyük ve belirgin */}
        {isAdmin && !isBayi && !isSaha && (
          <Typography
            variant="h6"
            sx={{
              ml: 2,
              fontWeight: 700,
              fontSize: { xs: '0.85rem', sm: '1rem' },
              color: '#fff',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              border: '2px solid rgba(255, 255, 255, 0.5)',
            }}
          >
            TOPLAM TUTAR: {toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
          </Typography>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
          {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </Typography>
        <IconButton color="inherit" onClick={handleMenuOpen} sx={{ p: 0.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <AccountCircle />
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem disabled>
            <AccountCircle sx={{ mr: 1 }} />
            {username}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogoutFromMenu}>
            <LogoutIcon sx={{ mr: 1 }} />
            Çıkış Yap
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default DashboardAppBar;
