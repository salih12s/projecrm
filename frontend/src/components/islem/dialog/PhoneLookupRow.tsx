import React from 'react';
import { Alert, AlertTitle, Box, Button, Grid, TextField, Typography } from '@mui/material';
import { formatPhone as formatPhoneNumber } from '../../../utils/format';

interface Props {
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  onSubmit: () => void;
}

const PhoneLookupRow: React.FC<Props> = ({ phoneNumber, onPhoneNumberChange, onSubmit }) => (
  <Box sx={{ mt: 1, mb: 1 }}>
    <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
      <AlertTitle sx={{ fontSize: '0.875rem', mb: 0.5 }}>Telefon Numarası Sorgusu</AlertTitle>
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        Lütfen müşterinin cep telefon numarasını girin. Daha önce kayıt varsa bilgileri getireceğiz.
      </Typography>
    </Alert>
    <Grid container spacing={1.5} alignItems="center">
      <Grid item xs={12} sm={8}>
        <TextField
          fullWidth
          autoFocus
          label="Cep Telefonu"
          value={formatPhoneNumber(phoneNumber)}
          onChange={(e) => onPhoneNumberChange(e.target.value)}
          placeholder="0544 448 88 88"
          helperText={`${phoneNumber.length}/11 hane`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Button
          fullWidth
          variant="contained"
          onClick={onSubmit}
          sx={{ height: 56 }}
        >
          Devam Et
        </Button>
      </Grid>
    </Grid>
  </Box>
);

export default PhoneLookupRow;
