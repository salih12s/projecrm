import React from 'react';
import {
  TableCell,
  IconButton,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  CheckCircle,
  Check,
  Print,
  PrintOutlined,
  History,
  Delete,
} from '@mui/icons-material';
import { Islem } from '../../../types';
import { formatPhoneNumber } from './islemTableUtils';

export interface ColumnConfig {
  id: string;
  label: string;
  render: (islem: Islem) => React.ReactNode;
}

interface Deps {
  onEdit: (islem: Islem) => void;
  onClone?: (islem: Islem) => void;
  onToggleDurum: (islem: Islem) => void;
  onDelete?: (islem: Islem) => void;
  isAdminMode: boolean;
  isBayi: boolean;
  setSelectedIslemForPrint: (i: Islem) => void;
  setPrintEditorOpen: (v: boolean) => void;
  handleOpenCustomerHistory: (name: string) => void;
  handleToggleYazdirildi: (islem: Islem, e: React.MouseEvent) => void;
}

export function createIslemColumnConfigs(deps: Deps): Record<string, ColumnConfig> {
  const {
    onEdit,
    onClone,
    onToggleDurum,
    onDelete,
    isAdminMode,
    isBayi,
    setSelectedIslemForPrint,
    setPrintEditorOpen,
    handleOpenCustomerHistory,
    handleToggleYazdirildi,
  } = deps;
  return {
    tarih: {
      id: 'tarih',
      label: 'Tarih',
      render: (islem) => {
        const tarihStr = islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : '-';
        return (
          <TableCell sx={{ fontWeight: 500, fontSize: '0.65rem', py: 0.1, px: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Tooltip title={tarihStr} arrow>
              <span>{tarihStr}</span>
            </Tooltip>
          </TableCell>
        );
      },
    },
    ad_soyad: {
      id: 'ad_soyad',
      label: 'Ad Soyad',
      render: (islem) => (
        <TableCell 
          sx={{ 
            fontWeight: 500, 
            fontSize: '0.65rem', 
            py: 0.1, 
            px: 0.2, 
            textTransform: 'uppercase', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            '&:hover': { bgcolor: 'action.hover' }
          }}
          onDoubleClick={() => onClone?.(islem)}
        >
          <Tooltip title={islem.ad_soyad || '-'} arrow>
            <span>{islem.ad_soyad || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    ilce: {
      id: 'ilce',
      label: 'İlçe',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.ilce || '-'} arrow>
            <span>{islem.ilce || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    mahalle: {
      id: 'mahalle',
      label: 'Mahalle',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.mahalle || '-'} arrow>
            <span>{islem.mahalle || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    cadde: {
      id: 'cadde',
      label: 'Cadde',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.cadde || '-'} arrow>
            <span>{islem.cadde || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    sokak: {
      id: 'sokak',
      label: 'Sokak',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.sokak || '-'} arrow>
            <span>{islem.sokak || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    apartman_site: {
      id: 'apartman_site',
      label: 'Apt/Site',
      render: (islem) => (
        <TableCell sx={{ 
          fontSize: '0.65rem', 
          py: 0.1, 
          px: 0.2, 
          textTransform: 'uppercase',
          maxWidth: '80px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {islem.apartman_site ? (
            <Tooltip title={islem.apartman_site} arrow>
              <span>{islem.apartman_site}</span>
            </Tooltip>
          ) : '-'}
        </TableCell>
      ),
    },
    blok_no: {
      id: 'blok_no',
      label: 'Blok',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.blok_no || '-'} arrow>
            <span>{islem.blok_no || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    daire_no: {
      id: 'daire_no',
      label: 'Daire',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.daire_no || '-'} arrow>
            <span>{islem.daire_no || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    kapi_no: {
      id: 'kapi_no',
      label: 'Kapı',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.kapi_no || '-'} arrow>
            <span>{islem.kapi_no || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    cep_tel: {
      id: 'cep_tel',
      label: 'Cep Tel',
      render: (islem) => {
        const formatted = islem.cep_tel ? formatPhoneNumber(islem.cep_tel) : '-';
        return (
          <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Tooltip title={formatted} arrow>
              <span>{formatted}</span>
            </Tooltip>
          </TableCell>
        );
      },
    },
    yedek_tel: {
      id: 'yedek_tel',
      label: 'Yedek',
      render: (islem) => {
        if (!islem.yedek_tel) return <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2 }}>-</TableCell>;
        const formatted = formatPhoneNumber(islem.yedek_tel);
        return (
          <TableCell sx={{ 
            fontSize: '0.65rem', 
            py: 0.1, 
            px: 0.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            <Tooltip title={formatted} arrow>
              <span>{formatted}</span>
            </Tooltip>
          </TableCell>
        );
      },
    },
    urun: {
      id: 'urun',
      label: 'Ürün',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.urun || '-'} arrow>
            <span>{islem.urun || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    marka: {
      id: 'marka',
      label: 'Marka',
      render: (islem) => (
        <TableCell sx={{ fontWeight: 500, fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.marka || '-'} arrow>
            <span>{islem.marka || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    sikayet: {
      id: 'sikayet',
      label: 'Şikayet',
      render: (islem) => (
        <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase' }}>
          <Tooltip title={islem.sikayet || '-'}>
            <span>{islem.sikayet || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    yapilan_islem: {
      id: 'yapilan_islem',
      label: 'Yapılan İşlem',
      render: (islem) => (
        <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase' }}>
          <Tooltip title={islem.yapilan_islem || '-'}>
            <span>{islem.yapilan_islem || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    teknisyen: {
      id: 'teknisyen',
      label: 'Teknisyen',
      render: (islem) => (
        <TableCell sx={{ fontSize: '0.65rem', py: 0.1, px: 0.2, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Tooltip title={islem.teknisyen_ismi || '-'} arrow>
            <span>{islem.teknisyen_ismi || '-'}</span>
          </Tooltip>
        </TableCell>
      ),
    },
    tutar: {
      id: 'tutar',
      label: 'Tutar',
      render: (islem) => {
        const tutarStr = islem.tutar ? `${Number(islem.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺` : '-';
        return (
          <TableCell sx={{ fontWeight: 600, fontSize: '0.65rem', py: 0.1, px: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Tooltip title={tutarStr} arrow>
              <span>{tutarStr}</span>
            </Tooltip>
          </TableCell>
        );
      },
    },
    durum: {
      id: 'durum',
      label: 'Durum',
      render: (islem) => (
        <TableCell sx={{ py: 0.1, px: 0.2 }}>
          {islem.is_durumu === 'acik' ? (
            <Chip
              label="Açık"
              color="warning"
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.6rem', height: '18px', '& .MuiChip-label': { px: 0.5 } }}
            />
          ) : islem.is_durumu === 'parca_bekliyor' ? (
            <Chip
              label="Parça Bekliyor"
              color="info"
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.6rem', height: '18px', '& .MuiChip-label': { px: 0.5 } }}
            />
          ) : islem.is_durumu === 'iptal' ? (
            <Chip
              label="İptal"
              color="error"
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.6rem', height: '18px', '& .MuiChip-label': { px: 0.5 } }}
            />
          ) : (
            <Chip
              icon={<CheckCircle sx={{ fontSize: '0.65rem' }} />}
              label="Tamamlandı"
              color="success"
              size="small"
              sx={{ fontWeight: 600, fontSize: '0.6rem', height: '18px', '& .MuiChip-label': { px: 0.5 } }}
            />
          )}
        </TableCell>
      ),
    },
    islemler: {
      id: 'islemler',
      label: 'İşlemler',
      render: (islem) => (
        <TableCell sx={{ py: 0.1, px: 0.2 }}>
          <Box sx={{ display: 'flex', gap: 0.15 }}>
            {!isBayi && (
              <>
                <Tooltip title={
                  islem.is_durumu === 'acik' ? 'Tamamla' : 
                  islem.is_durumu === 'parca_bekliyor' ? (isAdminMode ? 'Parça Bekliyor (Düzenle)' : 'Parça Bekliyor') :
                  islem.is_durumu === 'iptal' ? (isAdminMode ? 'İptal Edildi (Düzenle)' : 'İptal Edildi') :
                  (isAdminMode ? 'Tamamlandı' : 'Tamamlandı - Durum değiştirilemez')
                }>
                  <span>
                    <IconButton 
                      size="small" 
                      onClick={() => onToggleDurum(islem)}
                      disabled={!isAdminMode && (islem.is_durumu === 'tamamlandi' || islem.is_durumu === 'iptal')}
                      sx={{ 
                        bgcolor: islem.is_durumu === 'acik' ? 'warning.light' : 
                                 islem.is_durumu === 'parca_bekliyor' ? 'info.light' :
                                 islem.is_durumu === 'iptal' ? 'error.light' :
                                 (isAdminMode ? 'success.light' : 'grey.300'),
                        width: 20,
                        height: 20,
                        '&:hover': {
                          bgcolor: islem.is_durumu === 'acik' ? 'warning.main' : 
                                   islem.is_durumu === 'parca_bekliyor' ? 'info.main' :
                                   islem.is_durumu === 'iptal' ? 'error.main' :
                                   (isAdminMode ? 'success.main' : 'grey.300'),
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'grey.300',
                          opacity: 0.6,
                        }
                      }}
                    >
                      <Check sx={{ color: islem.is_durumu === 'acik' || islem.is_durumu === 'parca_bekliyor' || islem.is_durumu === 'iptal' ? 'white' : (isAdminMode ? 'white' : 'grey.500'), fontSize: '0.7rem' }} />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title='Düzenle'>
                  <span>
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit(islem)}
                      sx={{ 
                        bgcolor: 'primary.light',
                        width: 20,
                        height: 20,
                        '&:hover': {
                          bgcolor: 'primary.main',
                        },
                      }}
                    >
                      <Edit sx={{ color: 'white', fontSize: '0.7rem' }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </>
            )}
            <Tooltip title="Müşteri Geçmişi">
              <IconButton 
                size="small" 
                onClick={() => handleOpenCustomerHistory(islem.ad_soyad || '')}
                disabled={!islem.ad_soyad}
                sx={{ 
                  bgcolor: 'secondary.light',
                  width: 20,
                  height: 20,
                  '&:hover': {
                    bgcolor: 'secondary.main',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'grey.300',
                    opacity: 0.6,
                  }
                }}
              >
                <History sx={{ color: 'white', fontSize: '0.7rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={islem.yazdirildi ? "Yazdırılmadı olarak işaretle" : "Yazdırıldı olarak işaretle"}>
              <IconButton 
                size="small" 
                onClick={(e) => handleToggleYazdirildi(islem, e)}
                sx={{ 
                  bgcolor: islem.yazdirildi ? '#9c27b0' : 'grey.300',
                  width: 20,
                  height: 20,
                  '&:hover': {
                    bgcolor: islem.yazdirildi ? '#7b1fa2' : 'grey.400',
                  }
                }}
              >
                {islem.yazdirildi ? (
                  <Print sx={{ color: 'white', fontSize: '0.7rem' }} />
                ) : (
                  <PrintOutlined sx={{ color: 'grey.700', fontSize: '0.7rem' }} />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Yazdır">
              <IconButton 
                size="small" 
                onClick={() => {
                  setSelectedIslemForPrint(islem);
                  setPrintEditorOpen(true);
                }}
                sx={{ 
                  bgcolor: 'info.light',
                  width: 20,
                  height: 20,
                  '&:hover': {
                    bgcolor: 'info.main',
                  }
                }}
              >
                <Print sx={{ color: 'white', fontSize: '0.7rem' }} />
              </IconButton>
            </Tooltip>
            {/* Sadece admin için silme butonu */}
            {isAdminMode && onDelete && (
              <Tooltip title="Sil (Admin)">
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(islem)}
                  sx={{ 
                    bgcolor: 'error.light',
                    width: 20,
                    height: 20,
                    '&:hover': {
                      bgcolor: 'error.main',
                    }
                  }}
                >
                  <Delete sx={{ color: 'white', fontSize: '0.7rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </TableCell>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  };
}
