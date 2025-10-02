import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  Assignment,
  CheckCircle,
  HourglassEmpty,
  AttachMoney,
} from '@mui/icons-material';
import { Islem } from '../types';

interface StatsCardsProps {
  islemler: Islem[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ islemler }) => {
  const acikIsler = islemler.filter(i => i.is_durumu === 'acik').length;
  const tamamlananIsler = islemler.filter(i => i.is_durumu === 'tamamlandi').length;
  const toplamTutar = islemler.reduce((sum, i) => sum + (i.tutar || 0), 0);

  const stats = [
    {
      title: 'Toplam İşlem',
      value: islemler.length,
      icon: <Assignment />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
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
    {
      title: 'Toplam Tutar',
      value: `${toplamTutar.toFixed(2)} ₺`,
      icon: <AttachMoney />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
    },
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              },
            }}
          >
            <Box
              sx={{
                backgroundColor: stat.bgColor,
                color: stat.color,
                borderRadius: '12px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {React.cloneElement(stat.icon, { fontSize: 'large' })}
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {stat.title}
              </Typography>
              <Typography variant="h5" fontWeight="bold">
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
