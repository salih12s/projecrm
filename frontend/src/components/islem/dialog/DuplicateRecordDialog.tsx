import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  AlertTitle,
  Box,
  Grid,
  Typography,
} from '@mui/material';
import { Islem } from '../../../types';
import { formatPhoneNumber } from '../table/islemTableUtils';

interface Props {
  open: boolean;
  duplicateRecord: Islem | null;
  onCancel: () => void;
  onLoadExisting: () => void;
  onContinue: () => void;
}

const DuplicateRecordDialog: React.FC<Props> = ({
  open,
  duplicateRecord,
  onCancel,
  onLoadExisting,
  onContinue,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'warning.main', color: 'warning.contrastText', py: 1.5 }}>
        ⚠️ UYARI - Benzer Kayıt Bulundu
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Bu müşteri için tamamlanmamış bir kayıt mevcut!</AlertTitle>
          Aynı telefon numarası, ürün ve marka ile açık/parça bekliyor durumunda bir kayıt bulundu.
        </Alert>

        {duplicateRecord && (
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Mevcut Kayıt Bilgileri:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Kayıt ID:</strong> #{duplicateRecord.id}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Durum:</strong>{' '}
                  <Box
                    component="span"
                    sx={{
                      color: duplicateRecord.is_durumu === 'acik' ? 'warning.main' : 'info.main',
                      fontWeight: 600,
                    }}
                  >
                    {duplicateRecord.is_durumu === 'acik' ? 'Açık' : 'Parça Bekliyor'}
                  </Box>
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Ürün:</strong> {duplicateRecord.urun}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Marka:</strong> {duplicateRecord.marka}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Telefon:</strong> {formatPhoneNumber(duplicateRecord.cep_tel)}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Mevcut kaydın bilgilerini getirmek veya yeni bir kayıt oluşturmak istiyor musunuz?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onCancel} variant="outlined" size="small" color="error">
          İptal Et
        </Button>
        <Button onClick={onLoadExisting} variant="contained" color="primary" size="small" autoFocus>
          Bilgileri Getir
        </Button>
        <Button onClick={onContinue} variant="contained" color="warning" size="small">
          Yeni Kayıt Oluştur
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateRecordDialog;
