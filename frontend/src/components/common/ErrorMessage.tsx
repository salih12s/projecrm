import React from 'react';
import { Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        m: 2,
        textAlign: 'center',
        maxWidth: 500,
        mx: 'auto',
      }}
    >
      <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Bir Hata Oluştu
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {message}
      </Typography>
      {onRetry && (
        <Button variant="contained" onClick={onRetry}>
          Tekrar Dene
        </Button>
      )}
    </Paper>
  );
};

export default ErrorMessage;
