import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Atolye } from '../../types';
import {
  getAtolyeStatusColor as getStatusColor,
  getAtolyeStatusLabel as getStatusLabel,
  getAtolyeRowBackgroundColor as getRowBackgroundColor,
} from '../../constants/atolyeStatus';
import { formatDate, formatPhoneNumber } from './atolyeUtils';

/**
 * AtolyeTableView (Part 3 / P3.E1).
 *
 * Masaüstü görünüm: filtre input satırı + mavi başlık satırı + body +
 * footer pagination. AtolyeTakip içinden davranış değiştirilmeden
 * taşındı. Renkler, sticky pozisyonlar, padding/fontSize değerleri ve
 * MUI sx prop'ları birebir aynı.
 */

export interface FilterState {
  sira: string;
  teslim_durumu: string;
  tarih: string;
  bayi_adi: string;
  musteri_ad_soyad: string;
  tel_no: string;
  marka: string;
  kod: string;
  seri_no: string;
  sikayet: string;
  ozel_not: string;
  yapilan_islem: string;
  note_no: string;
  ucret: string;
  yapilma_tarihi: string;
}

export interface AtolyeTableViewProps {
  displayedList: Atolye[];
  totalCount: number;
  atolyeList: Atolye[];
  loading: boolean;
  isBayi: boolean;
  isAdmin: boolean;
  filters: FilterState;
  onFilterChange: (field: string, value: string) => void;
  page: number;
  rowsPerPage: number;
  onChangePage: (event: unknown, newPage: number) => void;
  onChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

// Ortak filtre TextField stili — orijinaldeki sx objesi.
const filterInputSx = {
  width: '100%',
  backgroundColor: 'white',
  '& .MuiInputBase-input': { padding: '3px 6px', fontSize: '0.75rem' },
};
const filterInputSxNarrow = {
  width: '100%',
  backgroundColor: 'white',
  '& .MuiInputBase-input': { padding: '3px 4px', fontSize: '0.7rem' },
};
const filterCellSx = (width: string) => ({
  width,
  padding: '3px',
  position: 'sticky' as const,
  top: 0,
  backgroundColor: '#f5f5f5',
  zIndex: 10,
});
const headerCellSx = {
  color: 'white',
  fontWeight: 'bold',
  padding: '6px',
  fontSize: '0.75rem',
  position: 'sticky' as const,
  top: 30,
  backgroundColor: '#0D3282',
  zIndex: 9,
};

const AtolyeTableView: React.FC<AtolyeTableViewProps> = ({
  displayedList,
  totalCount,
  atolyeList,
  loading,
  isBayi,
  isAdmin,
  filters,
  onFilterChange,
  page,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
  onEdit,
  onDelete,
}) => {
  return (
    <>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
        <Table size="small" stickyHeader sx={{
          '& .MuiTableCell-root': {
            borderRight: '1px solid rgba(0, 0, 0, 1)',
            borderBottom: '1px solid rgba(0, 0, 0, 1)'
          }
        }}>
          <TableHead>
            {/* Filter Row */}
            <TableRow>
              <TableCell sx={filterCellSx('40px')}>
                <TextField size="small" placeholder="#" value={filters.sira}
                  onChange={(e) => onFilterChange('sira', e.target.value)}
                  sx={filterInputSxNarrow} />
              </TableCell>
              <TableCell sx={filterCellSx('100px')}>
                <TextField select size="small" placeholder="Durum..." value={filters.teslim_durumu}
                  onChange={(e) => onFilterChange('teslim_durumu', e.target.value)}
                  sx={filterInputSx}>
                  <MenuItem value="">Tümü</MenuItem>
                  <MenuItem value="beklemede">Beklemede</MenuItem>
                  <MenuItem value="siparis_verildi">Sipariş Verildi</MenuItem>
                  <MenuItem value="yapildi">Yapıldı</MenuItem>
                  <MenuItem value="fabrika_gitti">Fabrika Gitti</MenuItem>
                  <MenuItem value="odeme_bekliyor">Ödeme Bekliyor</MenuItem>
                  <MenuItem value="teslim_edildi">Teslim Edildi</MenuItem>
                </TextField>
              </TableCell>
              <TableCell sx={filterCellSx('85px')}>
                <TextField size="small" placeholder="GG.AA.YYYY" value={filters.tarih}
                  onChange={(e) => onFilterChange('tarih', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('100px')}>
                <TextField size="small" placeholder="Bayi..." value={filters.bayi_adi}
                  onChange={(e) => onFilterChange('bayi_adi', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('120px')}>
                <TextField size="small" placeholder="Müşteri..." value={filters.musteri_ad_soyad}
                  onChange={(e) => onFilterChange('musteri_ad_soyad', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('100px')}>
                <TextField size="small" placeholder="Telefon..." value={filters.tel_no}
                  onChange={(e) => onFilterChange('tel_no', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('85px')}>
                <TextField size="small" placeholder="Marka..." value={filters.marka}
                  onChange={(e) => onFilterChange('marka', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('75px')}>
                <TextField size="small" placeholder="Kod..." value={filters.kod}
                  onChange={(e) => onFilterChange('kod', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('75px')}>
                <TextField size="small" placeholder="Seri..." value={filters.seri_no}
                  onChange={(e) => onFilterChange('seri_no', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('120px')}>
                <TextField size="small" placeholder="Şikayet..." value={filters.sikayet}
                  onChange={(e) => onFilterChange('sikayet', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('100px')}>
                <TextField size="small" placeholder="Not..." value={filters.ozel_not}
                  onChange={(e) => onFilterChange('ozel_not', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('120px')}>
                <TextField size="small" placeholder="İşlem..." value={filters.yapilan_islem}
                  onChange={(e) => onFilterChange('yapilan_islem', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('80px')}>
                <TextField size="small" placeholder="Note..." value={filters.note_no}
                  onChange={(e) => onFilterChange('note_no', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('70px')}>
                <TextField size="small" placeholder="Ücret..." value={filters.ucret}
                  onChange={(e) => onFilterChange('ucret', e.target.value)} sx={filterInputSx} />
              </TableCell>
              <TableCell sx={filterCellSx('85px')}>
                <TextField size="small" placeholder="GG.AA.YYYY" value={filters.yapilma_tarihi}
                  onChange={(e) => onFilterChange('yapilma_tarihi', e.target.value)} sx={filterInputSx} />
              </TableCell>
              {!isBayi && <TableCell sx={filterCellSx('80px')}></TableCell>}
            </TableRow>
            {/* Header Row */}
            <TableRow sx={{ backgroundColor: '#0D3282' }}>
              <TableCell sx={{ ...headerCellSx, fontSize: '0.875rem', textAlign: 'center' }}>Sıra</TableCell>
              <TableCell sx={headerCellSx}>Teslim Durumu</TableCell>
              <TableCell sx={headerCellSx}>Tarih</TableCell>
              <TableCell sx={headerCellSx}>Bayi Adı</TableCell>
              <TableCell sx={headerCellSx}>Müşteri</TableCell>
              <TableCell sx={headerCellSx}>Tel No</TableCell>
              <TableCell sx={headerCellSx}>Marka</TableCell>
              <TableCell sx={headerCellSx}>Model</TableCell>
              <TableCell sx={headerCellSx}>Seri No</TableCell>
              <TableCell sx={headerCellSx}>Şikayet</TableCell>
              <TableCell sx={headerCellSx}>Özel Not</TableCell>
              <TableCell sx={headerCellSx}>Yapılan İşlem</TableCell>
              <TableCell sx={headerCellSx}>Note No</TableCell>
              <TableCell sx={headerCellSx}>Ücret</TableCell>
              <TableCell sx={headerCellSx}>Yapılma Tarihi</TableCell>
              {!isBayi && <TableCell sx={headerCellSx}>İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedList.map((atolye) => {
              const siraNo = atolye.id;
              return (
                <TableRow
                  key={atolye.id}
                  hover
                  onDoubleClick={() => !isBayi && onEdit(atolye.id)}
                  sx={{
                    backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
                    cursor: !isBayi ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: getRowBackgroundColor(atolye.teslim_durumu),
                      filter: 'brightness(0.95)',
                    },
                  }}
                >
                  <TableCell sx={{ padding: '3px', fontSize: '1rem', fontWeight: 'bold', textAlign: 'center' }}>{siraNo}</TableCell>
                  <TableCell sx={{ padding: '3px' }}>
                    <Chip
                      label={getStatusLabel(atolye.teslim_durumu)}
                      color={getStatusColor(atolye.teslim_durumu)}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        height: '20px',
                        ...(atolye.teslim_durumu === 'siparis_verildi' && {
                          backgroundColor: '#9c27b0',
                          color: 'white',
                        }),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatDate(atolye.kayit_tarihi || atolye.created_at)}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.bayi_adi}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.musteri_ad_soyad}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{formatPhoneNumber(atolye.tel_no)}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.marka}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.kod || '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', textTransform: 'uppercase' }}>{atolye.seri_no || '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.sikayet} placement="top" arrow>
                      <span>{atolye.sikayet}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.ozel_not || '-'} placement="top" arrow>
                      <span>{atolye.ozel_not || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.yapilan_islem || '-'} placement="top" arrow>
                      <span>{atolye.yapilan_islem || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                    <Tooltip title={atolye.note_no || '-'} placement="top" arrow>
                      <span>{atolye.note_no || '-'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.ucret ? `${atolye.ucret} ₺` : '-'}</TableCell>
                  <TableCell sx={{ padding: '3px', fontSize: '0.75rem' }}>{atolye.yapilma_tarihi ? formatDate(atolye.yapilma_tarihi) : '-'}</TableCell>
                  {!isBayi && (
                    <TableCell sx={{ padding: '3px' }}>
                      <IconButton size="small" onClick={() => onEdit(atolye.id)} sx={{ mr: 0.5, padding: '3px' }}>
                        <Edit fontSize="small" sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      {isAdmin && (
                        <IconButton size="small" onClick={() => onDelete(atolye.id)} color="error" sx={{ padding: '3px' }}>
                          <Delete fontSize="small" sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {displayedList.length === 0 && (
              <TableRow>
                <TableCell colSpan={isBayi ? 14 : 15} align="center" sx={{ py: 3 }}>
                  {loading ? <CircularProgress size={24} /> : (atolyeList.length === 0 ? 'Henüz kayıt bulunmamaktadır' : 'Filtreye uygun kayıt bulunamadı')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={onChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onChangeRowsPerPage}
        rowsPerPageOptions={[25, 50, 100, 200]}
        labelRowsPerPage="Sayfa başına:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        sx={{ borderTop: '1px solid #e0e0e0' }}
      />
    </>
  );
};

export default AtolyeTableView;
