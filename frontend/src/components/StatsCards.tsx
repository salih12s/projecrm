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
}

const StatsCards: React.FC<StatsCardsProps> = ({ islemler }) => {
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
  }> = [
    {
      title: 'Toplam İşlem',
      value: islemler.length,
      icon: <Assignment />,
      color: '#0D3282',
      bgColor: '#E8EDF7',
    },
    {
      title: 'Açık İşler',
      value: acikIsler,
      icon: <HourglassEmpty />,
      color: '#ed6c02',
      bgColor: '#fff4e5',
    },
    {
      title: 'Tamamlanan',
      value: tamamlananIsler,
      icon: <CheckCircle />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
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
    });
  }

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={isAdmin ? 3 : 4} key={index}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              transition: 'transform 0.2s',
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
