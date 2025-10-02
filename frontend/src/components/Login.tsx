import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';

const Login: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      if (tabValue === 0) {
        // Giriş
        await login(username, password);
        showSnackbar('Başarıyla giriş yaptınız!', 'success');
        navigate('/');
      } else {
        // Kayıt
        await register(username, password);
        setSuccess('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        showSnackbar('Kayıt başarılı! Giriş yapabilirsiniz.', 'success');
        setUsername('');
        setPassword('');
        setTimeout(() => setTabValue(0), 2000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Bir hata oluştu';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            CRM Sistemi
          </Typography>

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
            <Tab label="Giriş Yap" />
            <Tab label="Kayıt Ol" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Kullanıcı Adı"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Şifre"
              type="password"
              autoComplete={tabValue === 0 ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {tabValue === 0 ? 'Giriş Yap' : 'Kayıt Ol'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
