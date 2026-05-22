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
import { AdminPanelSettings, Store, Person, Engineering } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../context/SnackbarContext';

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'select' | 'admin' | 'bayi' | 'user' | 'saha'>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, bayiLogin, adminLogin, sahaLogin } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleLoginTypeSelect = (type: 'admin' | 'bayi' | 'user' | 'saha') => {
    setLoginType(type);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleBack = () => {
    setLoginType('select');
    setError('');
    setUsername('');
    setPassword('');
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
        await adminLogin(username, password);
        showSnackbar('Admin girişi başarılı!', 'success');
        navigate('/');
      } else if (loginType === 'bayi') {
        await bayiLogin(username, password);
        showSnackbar('Bayi girişi başarılı!', 'success');
        navigate('/');
      } else if (loginType === 'saha') {
        await sahaLogin(username, password);
        showSnackbar('Saha girişi başarılı!', 'success');
        navigate('/');
      } else if (loginType === 'user') {
        await login(username, password);
        showSnackbar('Giriş başarılı!', 'success');
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
          marginTop: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ mb: 4, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            CRM Sistemi
          </Typography>

          {loginType === 'select' && (
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={6} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => handleLoginTypeSelect('user')} sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 }, px: 1 }}>
                      <Person sx={{ fontSize: { xs: 50, sm: 70 }, color: '#0D3282', mb: 1 }} />
                      <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                        Kullanıcı Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        Normal kullanıcı olarak giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => handleLoginTypeSelect('admin')} sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 }, px: 1 }}>
                      <AdminPanelSettings sx={{ fontSize: { xs: 50, sm: 70 }, color: '#0D3282', mb: 1 }} />
                      <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                        Admin Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        Yönetici paneline giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => handleLoginTypeSelect('bayi')} sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 }, px: 1 }}>
                      <Store sx={{ fontSize: { xs: 50, sm: 70 }, color: '#0D3282', mb: 1 }} />
                      <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                        Bayi Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        Bayi paneline giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => handleLoginTypeSelect('saha')} sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 }, px: 1 }}>
                      <Engineering sx={{ fontSize: { xs: 50, sm: 70 }, color: '#0D3282', mb: 1 }} />
                      <Typography variant="h6" component="div" sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                        Saha Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                        Saha elemanı olarak giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          )}

          {(loginType === 'admin' || loginType === 'bayi' || loginType === 'user' || loginType === 'saha') && (
            <>
              <Typography variant="h6" align="center" sx={{ mb: 3 }}>
                {loginType === 'admin' ? 'Admin Girişi' : loginType === 'bayi' ? 'Bayi Girişi' : loginType === 'saha' ? 'Saha Girişi' : 'Kullanıcı Girişi'}
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
