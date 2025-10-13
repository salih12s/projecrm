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
import { AdminPanelSettings, Store, Person } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from '../context/SnackbarContext';

const Login: React.FC = () => {
  const [loginType, setLoginType] = useState<'select' | 'admin' | 'bayi' | 'user'>('select');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, bayiLogin, adminLogin } = useAuth();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const handleLoginTypeSelect = (type: 'admin' | 'bayi' | 'user') => {
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
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardActionArea onClick={() => handleLoginTypeSelect('user')}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Person sx={{ fontSize: 80, color: '#0D3282', mb: 2 }} />
                      <Typography variant="h5" component="div">
                        Kullanıcı Girişi
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Normal kullanıcı olarak giriş yap
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
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

          {(loginType === 'admin' || loginType === 'bayi' || loginType === 'user') && (
            <>
              <Typography variant="h6" align="center" sx={{ mb: 3 }}>
                {loginType === 'admin' ? 'Admin Girişi' : loginType === 'bayi' ? 'Bayi Girişi' : 'Kullanıcı Girişi'}
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
