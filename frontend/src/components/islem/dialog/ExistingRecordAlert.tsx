import React from 'react';
import { Alert, AlertTitle, Box, Button, Typography } from '@mui/material';
import { Islem } from '../../../types';
import { formatPhone as formatPhoneNumber } from '../../../utils/format';
import CustomerHistoryTable from './CustomerHistoryTable';

interface Props {
  existingRecord: Islem;
  customerHistory: Islem[];
  historyLoading: boolean;
  onUseExistingData: () => void;
}

const ExistingRecordAlert: React.FC<Props> = ({
  existingRecord, customerHistory, historyLoading, onUseExistingData,
}) => (
  <Box sx={{ mt: 1 }}>
    <Alert
      severity="warning"
      sx={{ mb: 1.5, py: 0.5 }}
      action={
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button color="inherit" size="small" onClick={onUseExistingData}>
            Bilgileri Getir ve Yeni Kayıt Aç
          </Button>
        </Box>
      }
    >
      <AlertTitle sx={{ fontSize: '0.875rem', mb: 0.5 }}>Daha Önce Kayıt Bulundu!</AlertTitle>
      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
        Bu telefon numarasıyla ({formatPhoneNumber(existingRecord.cep_tel)}) daha önce <strong>{existingRecord.ad_soyad}</strong> adına kayıt açılmış.
      </Typography>
    </Alert>

    {/* Müşteri Geçmişi Tablosu - Direkt Görünür */}
    <CustomerHistoryTable
      customerHistory={customerHistory}
      historyLoading={historyLoading}
    />
  </Box>
);

export default ExistingRecordAlert;
