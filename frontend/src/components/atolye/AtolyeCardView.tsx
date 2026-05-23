import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  Typography,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Atolye } from '../../types';
import { formatDate } from './atolyeUtils';

/**
 * AtolyeCardView (Part 3 / P3.E1).
 *
 * Mobil (<=sm) cihazlar için kart tabanlı liste. AtolyeTakip içinden
 * davranış değiştirilmeden taşındı. Telefon numarası burada hâlâ raw
 * (`atolye.tel_no`) olarak gösterilir — orijinal davranışı korumak için
 * formatPhoneNumber uygulanmadı (legacy mobil görünüm böyleydi).
 */

export interface AtolyeCardViewProps {
  atolyeList: Atolye[];
  isBayi: boolean;
  isAdmin: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const AtolyeCardView: React.FC<AtolyeCardViewProps> = ({ atolyeList, isBayi, isAdmin, onEdit, onDelete }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
      {atolyeList.map((atolye) => {
        const siraNo = atolye.id;
        return (
          <Card
            key={atolye.id}
            elevation={2}
            onDoubleClick={() => !isBayi && onEdit(atolye.id)}
            sx={{ cursor: !isBayi ? 'pointer' : 'default' }}
          >
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Chip
                  label={`Sıra: ${siraNo}`}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, fontSize: '0.875rem' }}
                />
                <Chip
                  label={
                    atolye.teslim_durumu === 'beklemede' ? 'Beklemede' :
                    atolye.teslim_durumu === 'teslim_edildi' ? 'Teslim Edildi' :
                    atolye.teslim_durumu === 'siparis_verildi' ? 'Sipariş Verildi' :
                    atolye.teslim_durumu === 'yapildi' ? 'Yapıldı' :
                    atolye.teslim_durumu === 'fabrika_gitti' ? 'Fabrika Gitti' :
                    atolye.teslim_durumu === 'odeme_bekliyor' ? 'Ödeme Bekliyor' : '-'
                  }
                  size="small"
                  color={
                    atolye.teslim_durumu === 'beklemede' ? 'warning' :
                    atolye.teslim_durumu === 'teslim_edildi' ? 'info' :
                    atolye.teslim_durumu === 'siparis_verildi' ? 'secondary' :
                    atolye.teslim_durumu === 'yapildi' ? 'success' :
                    atolye.teslim_durumu === 'fabrika_gitti' ? 'default' :
                    atolye.teslim_durumu === 'odeme_bekliyor' ? 'error' : 'default'
                  }
                />
              </Box>

              <Grid container spacing={0.5} sx={{ fontSize: '0.75rem' }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Tarih:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                    {formatDate(atolye.kayit_tarihi || atolye.created_at) || '-'}
                  </Typography>
                </Grid>
                {!isBayi && atolye.bayi_adi && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Bayi:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.bayi_adi}</Typography>
                  </Grid>
                )}
                {atolye.musteri_ad_soyad && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Müşteri:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {atolye.musteri_ad_soyad}
                    </Typography>
                  </Grid>
                )}
                {atolye.tel_no && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Tel:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{atolye.tel_no}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Marka:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.marka || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Model:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.kod || '-'}</Typography>
                </Grid>
                {atolye.seri_no && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Seri No:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.seri_no}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">Şikayet:</Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.sikayet || '-'}</Typography>
                </Grid>
                {atolye.ozel_not && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Özel Not:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.ozel_not}</Typography>
                  </Grid>
                )}
                {atolye.yapilan_islem && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Yapılan İşlem:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.yapilan_islem}</Typography>
                  </Grid>
                )}
                {atolye.ucret && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Ücret:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{atolye.ucret} ₺</Typography>
                  </Grid>
                )}
                {atolye.yapilma_tarihi && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Yapılma Tarihi:</Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {formatDate(atolye.yapilma_tarihi) || '-'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>

            <Divider />

            <CardActions sx={{ justifyContent: 'flex-end', py: 0.5 }}>
              {!isBayi && (
                <Tooltip title="Düzenle">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(atolye.id)}
                    sx={{ bgcolor: 'primary.light' }}
                  >
                    <Edit sx={{ fontSize: '1rem', color: 'white' }} />
                  </IconButton>
                </Tooltip>
              )}
              {isAdmin && (
                <Tooltip title="Sil">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(atolye.id)}
                    sx={{ bgcolor: 'error.light' }}
                  >
                    <Delete sx={{ fontSize: '1rem', color: 'white' }} />
                  </IconButton>
                </Tooltip>
              )}
            </CardActions>
          </Card>
        );
      })}
    </Box>
  );
};

export default AtolyeCardView;
