import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
  Print,
} from '@mui/icons-material';
import { Islem } from '../types';
import { format } from 'date-fns';

interface IslemTableProps {
  islemler: Islem[];
  loading: boolean;
  onEdit: (islem: Islem) => void;
  onDelete: (id: number) => void;
  onToggleDurum: (islem: Islem) => void;
}

const IslemTable: React.FC<IslemTableProps> = ({
  islemler,
  loading,
  onEdit,
  onDelete,
  onToggleDurum,
}) => {
  const handlePrint = (islem: Islem) => {
    const printContent = `
      <html>
        <head>
          <title>Servis Fişi - ${islem.marka}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .info { margin: 10px 0; }
            .info strong { display: inline-block; width: 150px; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${islem.marka} - Servis Fişi</h1>
          <div class="info"><strong>Tarih:</strong> ${new Date(islem.full_tarih).toLocaleString('tr-TR')}</div>
          <div class="info"><strong>Ad Soyad:</strong> ${islem.ad_soyad}</div>
          <div class="info"><strong>Adres:</strong> ${islem.ilce}, ${islem.mahalle}, ${islem.cadde}, ${islem.sokak}</div>
          <div class="info"><strong>Kapı No:</strong> ${islem.kapi_no}</div>
          ${islem.apartman_site ? `<div class="info"><strong>Apartman/Site:</strong> ${islem.apartman_site}</div>` : ''}
          ${islem.blok_no ? `<div class="info"><strong>Blok No:</strong> ${islem.blok_no}</div>` : ''}
          ${islem.daire_no ? `<div class="info"><strong>Daire No:</strong> ${islem.daire_no}</div>` : ''}
          <div class="info"><strong>Cep Tel:</strong> ${islem.cep_tel}</div>
          ${islem.sabit_tel ? `<div class="info"><strong>Sabit Tel:</strong> ${islem.sabit_tel}</div>` : ''}
          <div class="info"><strong>Ürün:</strong> ${islem.urun}</div>
          <div class="info"><strong>Marka:</strong> ${islem.marka}</div>
          <div class="info"><strong>Şikayet:</strong> ${islem.sikayet}</div>
          ${islem.teknisyen_ismi ? `<div class="info"><strong>Teknisyen:</strong> ${islem.teknisyen_ismi}</div>` : ''}
          ${islem.yapilan_islem ? `<div class="info"><strong>Yapılan İşlem:</strong> ${islem.yapilan_islem}</div>` : ''}
          ${islem.tutar ? `<div class="info"><strong>Tutar:</strong> ${islem.tutar} TL</div>` : ''}
          <div class="info"><strong>Durum:</strong> ${islem.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'}</div>
          <br><br>
          <button onclick="window.print()">Yazdır</button>
        </body>
      </html>
    `;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Tarih</TableCell>
            <TableCell>Ad Soyad</TableCell>
            <TableCell>İlçe</TableCell>
            <TableCell>Mahalle</TableCell>
            <TableCell>Cadde</TableCell>
            <TableCell>Sokak</TableCell>
            <TableCell>Kapı No</TableCell>
            <TableCell>Cep Tel</TableCell>
            <TableCell>Ürün</TableCell>
            <TableCell>Marka</TableCell>
            <TableCell>Teknisyen</TableCell>
            <TableCell>Tutar</TableCell>
            <TableCell>Durum</TableCell>
            <TableCell>İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {islemler.map((islem) => (
            <TableRow key={islem.id} hover>
              <TableCell>
                {new Date(islem.full_tarih).toLocaleDateString('tr-TR')}
              </TableCell>
              <TableCell>{islem.ad_soyad}</TableCell>
              <TableCell>{islem.ilce}</TableCell>
              <TableCell>{islem.mahalle}</TableCell>
              <TableCell>{islem.cadde}</TableCell>
              <TableCell>{islem.sokak}</TableCell>
              <TableCell>{islem.kapi_no}</TableCell>
              <TableCell>{islem.cep_tel}</TableCell>
              <TableCell>{islem.urun}</TableCell>
              <TableCell>{islem.marka}</TableCell>
              <TableCell>{islem.teknisyen_ismi || '-'}</TableCell>
              <TableCell>{islem.tutar ? `${islem.tutar} TL` : '-'}</TableCell>
              <TableCell>
                <Chip
                  label={islem.is_durumu === 'acik' ? 'Açık' : 'Tamamlandı'}
                  color={islem.is_durumu === 'acik' ? 'warning' : 'success'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Tooltip title={islem.is_durumu === 'acik' ? 'Tamamla' : 'Açık İş Yap'}>
                  <IconButton size="small" onClick={() => onToggleDurum(islem)}>
                    {islem.is_durumu === 'acik' ? (
                      <RadioButtonUnchecked color="warning" />
                    ) : (
                      <CheckCircle color="success" />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Düzenle">
                  <IconButton size="small" onClick={() => onEdit(islem)}>
                    <Edit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Yazdır">
                  <IconButton size="small" onClick={() => handlePrint(islem)}>
                    <Print />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <IconButton size="small" onClick={() => onDelete(islem.id)}>
                    <Delete color="error" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IslemTable;
