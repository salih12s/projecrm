import React, { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Alert,
} from '@mui/material';
import { AdminPanelSettings, Store } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';
import { authService } from '../services/api';

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'select' | 'admin' | 'bayi' | 'admin-password'>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [systemPassword, setSystemPassword] = useState('');
  const [error, setError] = useState('');
  const { login, bayiLogin } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleLoginTypeSelect = (type: 'admin' | 'bayi') => {
    if (type === 'admin') {
      // Admin için önce sistem şifresi sor
      setLoginType('admin-password');
    } else {
      // Bayi için direkt login ekranı
      setLoginType(type);
    }
    setError('');
    setUsername('');
    setPassword('');
    setSystemPassword('');
  };

  const handleBack = () => {
    if (loginType === 'admin-password') {
      // Sistem şifresinden geri dön
      setLoginType('select');
    } else if (loginType === 'admin') {
      // Admin logindan sistem şifresine dön
      setLoginType('admin-password');
    } else {
      // Bayi logindan ana ekrana dön
      setLoginType('select');
    }
    setError('');
    setUsername('');
    setPassword('');
    setSystemPassword('');
  };

  const handleSystemPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!systemPassword) {
      setError('Lütfen sistem şifresini girin');
      return;
    }

    try {
      // Backend'e sistem şifresini doğrulat
      await authService.verifySystemPassword(systemPassword);
      
      // Doğru şifre - admin login ekranına geç
      setLoginType('admin');
      setSystemPassword('');
      showSnackbar('Sistem şifresi doğrulandı', 'success');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Geçersiz sistem şifresi!';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    try {
      if (loginType === 'admin') {
        await login(username, password);
        showSnackbar('Başarıyla giriş yaptınız!', 'success');
        navigate('/');
      } else if (loginType === 'bayi') {
        await bayiLogin(username, password);
        showSnackbar('Bayi girişi başarılı!', 'success');
        navigate('/');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Bir hata oluştu';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ mb: 4 }}>
            CRM Sistemi
          </Typography>

          {loginType === 'select' && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardActionArea onClick={() => handleLoginTypeSelect('admin')}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <AdminPanelSettings sx={{ fontSize: 80, color: '#0D3282', mb: 2 }} />
                      <Typography variant="h5" component="div">
                        Admin Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Yönetici paneline giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardActionArea onClick={() => handleLoginTypeSelect('bayi')}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Store sx={{ fontSize: 80, color: '#0D3282', mb: 2 }} />
                      <Typography variant="h5" component="div">
                        Bayi Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Bayi paneline giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          )}

          {loginType === 'admin-password' && (
            <>
              <Typography variant="h6" align="center" sx={{ mb: 3 }}>
                Sistem Güvenlik Şifresi
              </Typography>

              <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                Admin paneline erişmek için sistem şifresini girin
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSystemPasswordSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Sistem Şifresi"
                  type="password"
                  autoFocus
                  value={systemPassword}
                  onChange={(e) => setSystemPassword(e.target.value)}
                  placeholder="Sistem şifresini girin"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
                >
                  Devam Et
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                  sx={{ borderColor: '#0D3282', color: '#0D3282' }}
                >
                  Geri Dön
                </Button>
              </Box>
            </>
          )}

          {(loginType === 'admin' || loginType === 'bayi') && (
            <>
              <Typography variant="h6" align="center" sx={{ mb: 3 }}>
                {loginType === 'admin' ? 'Admin Girişi' : 'Bayi Girişi'}
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, backgroundColor: '#0D3282', '&:hover': { backgroundColor: '#082052' } }}
                >
                  Giriş Yap
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleBack}
                  sx={{ borderColor: '#0D3282', color: '#0D3282' }}
                >
                  Geri Dön
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
