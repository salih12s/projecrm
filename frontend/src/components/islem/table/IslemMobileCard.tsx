import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { CheckCircle, Delete, Edit, History, Print } from '@mui/icons-material';
import { Islem } from '../../../types';
import { formatPhoneNumber } from './islemTableUtils';

interface Props {
  islem: Islem;
  isAdminMode: boolean;
  isBayi: boolean;
  onToggleDurum: (islem: Islem) => void;
  onEdit: (islem: Islem) => void;
  onDelete?: (islem: Islem) => void;
  onOpenHistory: (name: string) => void;
  onPrint: (islem: Islem) => void;
}

const IslemMobileCard: React.FC<Props> = ({
  islem,
  isAdminMode,
  isBayi,
  onToggleDurum,
  onEdit,
  onDelete,
  onOpenHistory,
  onPrint,
}) => {
  const siraNo = islem.id;
  return (
    <Card key={islem.id} elevation={2}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Chip
            label={`Sıra: ${siraNo}`}
            size="small"
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={
              islem.is_durumu === 'acik' ? 'Açık' :
              islem.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' :
              'Tamamlandı'
            }
            size="small"
            color={
              islem.is_durumu === 'acik' ? 'warning' :
              islem.is_durumu === 'parca_bekliyor' ? 'info' :
              'success'
            }
          />
        </Box>

        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
          {islem.ad_soyad}
        </Typography>

        <Grid container spacing={0.5} sx={{ fontSize: '0.75rem' }}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Tarih:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">İlçe:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.ilce || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Adres:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {[islem.mahalle, islem.cadde, islem.sokak, islem.kapi_no].filter(Boolean).join(', ') || '-'}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Cep Tel:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {formatPhoneNumber(islem.cep_tel)}
            </Typography>
          </Grid>
          {islem.yedek_tel && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Yedek Tel:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {formatPhoneNumber(islem.yedek_tel)}
              </Typography>
            </Grid>
          )}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Ürün:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.urun || '-'}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary">Marka:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.marka || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary">Şikayet:</Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.sikayet || '-'}</Typography>
          </Grid>
          {islem.yapilan_islem && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Yapılan İşlem:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.yapilan_islem}</Typography>
            </Grid>
          )}
          {islem.teknisyen_ismi && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Teknisyen:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.teknisyen_ismi}</Typography>
            </Grid>
          )}
          {islem.tutar && (
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Tutar:</Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.tutar} ₺</Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'space-around', py: 0.5 }}>
        {!isBayi && (
          <>
            <Tooltip title={
              islem.is_durumu === 'acik' ? 'Tamamla' :
              islem.is_durumu === 'parca_bekliyor' ? (isAdminMode ? 'Parça Bekliyor (Düzenle)' : 'Parça Bekliyor') :
              (isAdminMode ? 'Durumu Değiştir (Admin)' : 'Tamamlandı')
            }>
              <span>
                <IconButton
                  size="small"
                  onClick={() => onToggleDurum(islem)}
                  disabled={!isAdminMode && (islem.is_durumu === 'tamamlandi' || islem.is_durumu === 'iptal')}
                  sx={{
                    bgcolor: islem.is_durumu === 'acik' ? 'warning.light' :
                             islem.is_durumu === 'parca_bekliyor' ? 'info.light' :
                             islem.is_durumu === 'iptal' ? 'error.light' :
                             (isAdminMode ? 'success.light' : 'grey.300'),
                  }}
                >
                  <CheckCircle sx={{ fontSize: '1rem' }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Düzenle">
              <IconButton
                size="small"
                onClick={() => onEdit(islem)}
                sx={{ bgcolor: 'primary.light' }}
              >
                <Edit sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title="Müşteri Geçmişi">
          <IconButton
            size="small"
            onClick={() => onOpenHistory(islem.ad_soyad || '')}
            disabled={!islem.ad_soyad}
            sx={{ bgcolor: 'secondary.light' }}
          >
            <History sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Yazdır">
          <IconButton
            size="small"
            onClick={() => onPrint(islem)}
            sx={{ bgcolor: 'info.light' }}
          >
            <Print sx={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
        {/* Sadece admin için silme butonu */}
        {isAdminMode && onDelete && (
          <Tooltip title="Sil (Admin)">
            <IconButton
              size="small"
              onClick={() => onDelete(islem)}
              sx={{ bgcolor: 'error.light' }}
            >
              <Delete sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};

export default IslemMobileCard;
