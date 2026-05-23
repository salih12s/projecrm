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
  password: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const CreateUserDialog: React.FC<Props> = ({
  open,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onClose,
  onSubmit,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
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
          label="Şifre"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button onClick={onSubmit} variant="contained">
          Oluştur
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateUserDialog;
