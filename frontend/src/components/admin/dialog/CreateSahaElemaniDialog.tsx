import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

interface Props {
  open: boolean;
  username: string;
  adSoyad: string;
  password: string;
  onUsernameChange: (v: string) => void;
  onAdSoyadChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const CreateSahaElemaniDialog: React.FC<Props> = ({
  open,
  username,
  adSoyad,
  password,
  onUsernameChange,
  onAdSoyadChange,
  onPasswordChange,
  onClose,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Saha Elemanı Oluştur</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Kullanıcı Adı"
          type="text"
          fullWidth
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Ad Soyad (Opsiyonel)"
          type="text"
          fullWidth
          value={adSoyad}
          onChange={(e) => onAdSoyadChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          label="Şifre"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={onSubmit} variant="contained" sx={{ bgcolor: '#0D3282' }}>
          Oluştur
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateSahaElemaniDialog;
