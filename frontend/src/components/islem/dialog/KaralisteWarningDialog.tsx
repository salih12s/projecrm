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
import { formatPhoneNumber } from '../table/islemTableUtils';

interface KaralisteRecord {
  ad_soyad?: string;
  cep_tel?: string;
  mahalle?: string;
  cadde?: string;
  sokak?: string;
  kapi_no?: string;
  sebep?: string;
}

interface Props {
  open: boolean;
  karalisteType: 'phone' | 'address' | string | null;
  karalisteRecord: KaralisteRecord | null;
  onCancel: () => void;
  onContinue: () => void;
}

const KaralisteWarningDialog: React.FC<Props> = ({
  open,
  karalisteType,
  karalisteRecord,
  onCancel,
  onContinue,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'error.main', color: 'error.contrastText', py: 1.5 }}>
        🚫 UYARI - Karaliste Kaydı
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>
            Bu {karalisteType === 'phone' ? 'telefon numarası' : 'adres'} karalistede kayıtlıdır!
          </AlertTitle>
          Bu kişi daha önce karalisteye eklenmiştir. Devam etmek istiyor musunuz?
        </Alert>

        {karalisteRecord && (
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Karaliste Kayıt Bilgileri:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Ad Soyad:</strong> {karalisteRecord.ad_soyad}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>Telefon:</strong>{' '}
                  {karalisteRecord.cep_tel ? formatPhoneNumber(karalisteRecord.cep_tel) : '-'}
                </Typography>
              </Grid>
              {karalisteRecord.mahalle && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Adres:</strong>{' '}
                    {[karalisteRecord.mahalle, karalisteRecord.cadde, karalisteRecord.sokak, karalisteRecord.kapi_no]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Grid>
              )}
              {karalisteRecord.sebep && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Sebep:</strong> {karalisteRecord.sebep}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onCancel} variant="contained" color="error" size="small">
          Vazgeç
        </Button>
        <Button onClick={onContinue} variant="contained" color="warning" size="small">
          Yine de Devam Et
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default KaralisteWarningDialog;
