import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Assignment,
  CheckCircle,
  HourglassEmpty,
  AttachMoney,
} from '@mui/icons-material';
import { Islem } from '../types';
import { useAuth } from '../context/AuthContext';

interface StatsCardsProps {
  islemler: Islem[];
  onFilterClick?: (filter: 'all' | 'acik' | 'tamamlandi') => void;
  activeFilter?: 'all' | 'acik' | 'tamamlandi';
}

const StatsCards: React.FC<StatsCardsProps> = ({ islemler, onFilterClick, activeFilter = 'all' }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const acikIsler = islemler.filter(i => i.is_durumu === 'acik').length;
  const tamamlananIsler = islemler.filter(i => i.is_durumu === 'tamamlandi').length;
  const toplamTutar = islemler.reduce((sum, i) => {
    const tutar = typeof i.tutar === 'number' ? i.tutar : parseFloat(String(i.tutar || 0));
    return sum + (isNaN(tutar) ? 0 : tutar);
  }, 0);

  const stats: Array<{
    title: string;
    value: string | number;
    icon: JSX.Element;
    color: string;
    bgColor: string;
    filterValue: 'all' | 'acik' | 'tamamlandi';
  }> = [
    {
      title: 'Toplam İşlem',
      value: islemler.length,
      icon: <Assignment />,
      color: '#0D3282',
      bgColor: '#E8EDF7',
      filterValue: 'all',
    },
    {
      title: 'Açık İşler',
      value: acikIsler,
      icon: <HourglassEmpty />,
      color: '#ed6c02',
      bgColor: '#fff4e5',
      filterValue: 'acik',
    },
    {
      title: 'Tamamlanan',
      value: tamamlananIsler,
      icon: <CheckCircle />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
      filterValue: 'tamamlandi',
    },
  ];

  // Toplam Tutar sadece admin için
  if (isAdmin) {
    stats.push({
      title: 'Toplam Tutar',
      value: `${toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`,
      icon: <AttachMoney />,
      color: '#0D3282',
      bgColor: '#E8EDF7',
      filterValue: 'all',
    });
  }

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={isAdmin ? 3 : 4} key={index}>
          <Paper
            elevation={1}
            onClick={() => onFilterClick && onFilterClick(stat.filterValue)}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: onFilterClick ? 'pointer' : 'default',
              transition: 'all 0.2s',
              border: activeFilter === stat.filterValue ? '2px solid' : '2px solid transparent',
              borderColor: activeFilter === stat.filterValue ? stat.color : 'transparent',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 2,
              },
            }}
          >
            <Box
              sx={{
                backgroundColor: stat.bgColor,
                color: stat.color,
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(stat.icon, { fontSize: 'medium' })}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {stat.title}
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                {stat.value}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;
