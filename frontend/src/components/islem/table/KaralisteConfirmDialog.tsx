import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
} from '@mui/material';

/**
 * KaralisteConfirmDialog (Part 3 / P3.E3).
 *
 * "Karalisteye Ekle" onay diyaloğu — IslemTable içindeki ilgili blok
 * birebir aynı içerikle çıkarıldı.
 */

export interface KaralisteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  loading: boolean;
  onConfirm: () => void;
}

const KaralisteConfirmDialog: React.FC<KaralisteConfirmDialogProps> = ({
  open, onClose, customerName, loading, onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ color: 'error.main' }}>⚠️ Karalisteye Ekle</DialogTitle>
    <DialogContent>
      <Typography>
        <strong>{customerName}</strong> isimli müşteriyi karalisteye eklemek istediğinize emin misiniz?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Bu müşterinin telefon numarası ve adresi ile yeni kayıt oluşturulduğunda uyarı verilecektir.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>İptal</Button>
      <Button onClick={onConfirm} variant="contained" color="error" disabled={loading}>
        {loading ? 'Ekleniyor...' : 'Karalisteye Ekle'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default KaralisteConfirmDialog;
