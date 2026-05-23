import React from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

/**
 * Uygulama seviyesi ErrorBoundary (Part 3 / P3.G4).
 *
 * Amaç: React render hatalarını ve özellikle code-splitting sonrası
 * lazy chunk yükleme hatalarını yakalayıp kullanıcıya anlamlı bir
 * mesaj göstermek. Aksi halde chunk indirilemediğinde uygulama beyaz
 * ekrana düşer.
 */

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Üretim ortamında merkezi bir log servisine gönderilebilir.
    // Şimdilik konsola yazıyoruz — debug log temizliği kapsamında
    // bilinçli olarak korunmuş tek frontend console.error grubu.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Yakalandı:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 2,
            backgroundColor: '#f5f5f5',
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 480, textAlign: 'center' }} elevation={3}>
            <Typography variant="h5" gutterBottom>
              Bir hata oluştu
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sayfa yüklenirken beklenmedik bir sorun yaşandı. Sayfayı yeniden
              yüklemek sorunu çözebilir.
            </Typography>
            {this.state.error?.message && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  textAlign: 'left',
                  backgroundColor: '#fafafa',
                  p: 1,
                  borderRadius: 1,
                  overflowX: 'auto',
                  mb: 2,
                }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Button variant="contained" onClick={this.handleReload}>
              Sayfayı Yenile
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
