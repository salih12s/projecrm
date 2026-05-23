import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * OnHoldCards (Part 3 / P3.E2).
 *
 * Sol-alt köşede `position: fixed` ile gösterilen beklemede form kartları.
 * Tıklamak forma geri döner; sağ üst × kartı siler. Davranış orijinal
 * Dashboard içindeki blok ile birebir aynı.
 */

export interface OnHoldCardsProps {
  onHoldFormData: any[];
  openDialog: boolean;
  onResume: (index: number) => void;
  onClear: (index: number) => void;
}

const OnHoldCards: React.FC<OnHoldCardsProps> = ({ onHoldFormData, openDialog, onResume, onClear }) => {
  if (onHoldFormData.length === 0 || openDialog) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        maxWidth: '50vw',
        zIndex: 1300,
      }}
    >
      {onHoldFormData.map((holdData, index) => (
        <Box
          key={index}
          sx={{
            bgcolor: 'warning.light',
            border: '2px solid',
            borderColor: 'warning.main',
            borderRadius: 2,
            boxShadow: 3,
            transition: 'all 0.2s',
            minWidth: 200,
            maxWidth: 250,
            position: 'relative',
          }}
        >
          {/* Kapatma Butonu */}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClear(index);
            }}
            size="small"
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              bgcolor: 'warning.main',
              color: 'white',
              width: 20,
              height: 20,
              zIndex: 1,
              '&:hover': { bgcolor: 'warning.dark' },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>

          {/* Kart İçeriği — Tıklanabilir */}
          <Box
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('button')) return;
              onResume(index);
            }}
            sx={{
              p: 1.5,
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'warning.dark', mb: 0.5 }}>
              📋 Bekleyen Form {onHoldFormData.length > 1 && `(${index + 1})`}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              {holdData.ad_soyad || 'İsimsiz'} - {holdData.cep_tel || 'Telefon yok'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              {holdData.urun || 'Ürün belirtilmemiş'} {holdData.marka ? `- ${holdData.marka}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'warning.dark', mt: 1, display: 'block' }}>
              Tıklayarak devam edin
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default OnHoldCards;
