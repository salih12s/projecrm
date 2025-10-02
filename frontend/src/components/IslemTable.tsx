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
import { printIslem } from '../utils/print';

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
    printIslem(islem);
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
