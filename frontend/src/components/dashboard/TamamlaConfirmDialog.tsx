import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

/**
 * TamamlaConfirmDialog (Part 3 / P3.E2).
 *
 * "İşlemi tamamla" onay diyaloğu. Dashboard içindeki blok birebir
 * aynı içerikle çıkarıldı.
 */

export interface TamamlaConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const TamamlaConfirmDialog: React.FC<TamamlaConfirmDialogProps> = ({ open, onCancel, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
        İşlemi Tamamla
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <DialogContentText>
          Bu işlemi <strong>tamamlandı</strong> olarak işaretlemek istediğinizden emin misiniz?
          <br /><br />
          <strong>Uyarı:</strong> İşlem tamamlandı olarak işaretlendikten sonra düzenlenemeyecektir.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined">İptal</Button>
        <Button onClick={onConfirm} variant="contained" color="success" autoFocus>Tamamla</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TamamlaConfirmDialog;
