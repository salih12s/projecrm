import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Divider,
  Skeleton,
  Button,
} from '@mui/material';
import {
  Edit,
  CheckCircle,
  Check,
  Print,
  PrintOutlined,
  DragIndicator,
  History,
  Delete,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Islem } from '../types';
import PrintEditor from './PrintEditor';
import { islemService } from '../services/api';

// Telefon numarasını formatla: 0544 448 88 88
const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

interface IslemTableProps {
  islemler: Islem[];
  loading: boolean;
  onEdit: (islem: Islem) => void;
  onClone?: (islem: Islem) => void; // Çift tıklama ile klonlama
  onToggleDurum: (islem: Islem) => void;
  onDelete?: (islem: Islem) => void; // Silme işlemi (sadece admin)
  isAdminMode?: boolean; // Admin için tamamlanan işlemleri de düzenleme izni
  isBayi?: boolean; // Bayi kullanıcıları için düzenleme/silme işlemlerini gizle
  onFilteredChange?: (filtered: Islem[]) => void; // Filtrelenmiş liste değiştiğinde callback
}

interface ColumnConfig {
  id: string;
  label: string;
  render: (islem: Islem) => React.ReactNode;
}

const IslemTable: React.FC<IslemTableProps> = ({
  islemler,
  loading,
  onEdit,
  onClone,
  onToggleDurum,
  onDelete,
  isAdminMode = false,
  isBayi = false,
  onFilteredChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [printEditorOpen, setPrintEditorOpen] = useState(false);
  const [selectedIslemForPrint, setSelectedIslemForPrint] = useState<Islem | null>(null);
  
  // ⚡ PAGINATION: Sayfa başına 100 kayıt göster
  const [displayLimit, setDisplayLimit] = useState(100);
  
  // Müşteri Geçmişi Dialog states
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<Islem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Islem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [historyFilters, setHistoryFilters] = useState({
    sira: '',
    tarih: '',
    ilce: '',
    mahalle: '',
    cadde: '',
    sokak: '',
    kapi_no: '',
    cep_tel: '',
    urun: '',
    marka: '',
    sikayet: '',
    yapilan_islem: '',
    teknisyen: '',
    tutar: '',
    durum: '',
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    sira: '',
    tarih: '',
    ad_soyad: '',
    ilce: '',
    mahalle: '',
    cadde: '',
    sokak: '',
    kapi_no: '',
    apartman_site: '',
    blok_no: '',
    daire_no: '',
    cep_tel: '',
    urun: '',
    marka: '',
    sikayet: '',
    yapilan_islem: '',
    teknisyen: '',
    tutar: '',
    durum: '',
  });

  // useMemo ile filtrelemeyi optimize et - sadece islemler veya filters değişince hesapla
  const filteredIslemler = useMemo(() => {
    let filtered = [...islemler];

    // Filter by tarih
    if (filters.tarih) {
      filtered = filtered.filter((item) =>
        item.full_tarih ? new Date(item.full_tarih).toLocaleDateString('tr-TR').includes(filters.tarih) : false
      );
    }

    // Filter by ad_soyad
    if (filters.ad_soyad) {
      filtered = filtered.filter((item) =>
        (item.ad_soyad || '').toLocaleLowerCase('tr-TR').includes(filters.ad_soyad.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by ilce
    if (filters.ilce) {
      filtered = filtered.filter((item) =>
        (item.ilce || '').toLocaleLowerCase('tr-TR').includes(filters.ilce.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by mahalle
    if (filters.mahalle) {
      filtered = filtered.filter((item) =>
        (item.mahalle || '').toLocaleLowerCase('tr-TR').includes(filters.mahalle.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by cadde
    if (filters.cadde) {
      filtered = filtered.filter((item) =>
        (item.cadde || '').toLocaleLowerCase('tr-TR').includes(filters.cadde.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by sokak
    if (filters.sokak) {
      filtered = filtered.filter((item) =>
        (item.sokak || '').toLocaleLowerCase('tr-TR').includes(filters.sokak.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by kapi_no
    if (filters.kapi_no) {
      filtered = filtered.filter((item) =>
        (item.kapi_no || '').toLocaleLowerCase('tr-TR').includes(filters.kapi_no.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by apartman_site
    if (filters.apartman_site) {
      filtered = filtered.filter((item) =>
        (item.apartman_site || '').toLocaleLowerCase('tr-TR').includes(filters.apartman_site.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by blok_no
    if (filters.blok_no) {
      filtered = filtered.filter((item) =>
        (item.blok_no || '').toLocaleLowerCase('tr-TR').includes(filters.blok_no.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by daire_no
    if (filters.daire_no) {
      filtered = filtered.filter((item) =>
        (item.daire_no || '').toLocaleLowerCase('tr-TR').includes(filters.daire_no.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by cep_tel (hem cep telefonu hem de yedek telefon)
    if (filters.cep_tel) {
      const cleanPhone = filters.cep_tel.replace(/\D/g, '');
      filtered = filtered.filter((item) =>
        (item.cep_tel || '').includes(cleanPhone) || 
        (item.yedek_tel || '').includes(cleanPhone)
      );
    }

    // Filter by urun
    if (filters.urun) {
      filtered = filtered.filter((item) =>
        (item.urun || '').toLocaleLowerCase('tr-TR').includes(filters.urun.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by marka
    if (filters.marka) {
      filtered = filtered.filter((item) =>
        (item.marka || '').toLocaleLowerCase('tr-TR').includes(filters.marka.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by sikayet
    if (filters.sikayet) {
      filtered = filtered.filter((item) =>
        (item.sikayet || '').toLocaleLowerCase('tr-TR').includes(filters.sikayet.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by yapilan_islem
    if (filters.yapilan_islem) {
      filtered = filtered.filter((item) =>
        (item.yapilan_islem || '').toLocaleLowerCase('tr-TR').includes(filters.yapilan_islem.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by teknisyen - teknisyen_ismi kullan
    if (filters.teknisyen) {
      filtered = filtered.filter((item) =>
        (item.teknisyen_ismi || '').toLocaleLowerCase('tr-TR').includes(filters.teknisyen.toLocaleLowerCase('tr-TR'))
      );
    }

    // Filter by tutar
    if (filters.tutar) {
      filtered = filtered.filter((item) =>
        (item.tutar?.toString() || '').includes(filters.tutar)
      );
    }

    // Filter by durum - is_durumu kullan
    if (filters.durum) {
      const durumText = filters.durum.toLowerCase();
      filtered = filtered.filter((item) => {
        const label = item.is_durumu === 'tamamlandi' ? 'tamamlandı' : 
                      item.is_durumu === 'parca_bekliyor' ? 'parça bekliyor' : 
                      item.is_durumu === 'iptal' ? 'iptal' :
                      'açık';
        return label.includes(durumText);
      });
    }

    // Filter by sira - ID bazlı sabit sıra (silince kaymasın)
    if (filters.sira) {
      filtered = filtered.filter((item) => {
        return item.id.toString().includes(filters.sira);
      });
    }

    return filtered;
  }, [islemler, filters]);

  // Filtrelenmiş liste değiştiğinde parent'a bildir ve displayLimit'i resetle
  useEffect(() => {
    if (onFilteredChange) {
      onFilteredChange(filteredIslemler);
    }
    // Filtre değiştiğinde limit'i resetle
    setDisplayLimit(100);
  }, [filteredIslemler, onFilteredChange]);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePrintClick = useCallback((islem: Islem) => {
    setSelectedIslemForPrint(islem);
    setPrintEditorOpen(true);
  }, []);

  const handlePrintClose = useCallback(() => {
    setPrintEditorOpen(false);
    setSelectedIslemForPrint(null);
  }, []);

  const handleClosePrintEditor = useCallback(() => {
    setPrintEditorOpen(false);
    setSelectedIslemForPrint(null);
  }, []);

  // Yazdırıldı durumunu toggle et
  const handleToggleYazdirildi = useCallback(async (islem: Islem, event: React.MouseEvent) => {
    event.stopPropagation(); // Satır tıklamasını engelle
    try {
      const newYazdirildi = !islem.yazdirildi;
      await islemService.update(islem.id, { ...islem, yazdirildi: newYazdirildi } as any);
      // Socket.IO otomatik güncelleyecek, manuel güncellemeye gerek yok
    } catch (error) {
      console.error('Yazdırıldı durumu güncellenirken hata:', error);
    }
  }, []);

  // Müşteri Geçmişi fonksiyonları
  const handleOpenCustomerHistory = useCallback(async (customerName: string) => {
    if (!customerName || customerName.trim() === '') {
      return;
    }

    setSelectedCustomerName(customerName);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);

    try {
      const allIslemler = await islemService.getAll();
      // Müşteri adına göre filtrele ve en yeni en üstte sırala (ID'ye göre azalan)
      const customerIslemler = allIslemler
        .filter(i => i.ad_soyad && i.ad_soyad.toLowerCase().includes(customerName.toLowerCase()))
        .sort((a, b) => b.id - a.id); // En yeni en üstte
      
      setCustomerHistory(customerIslemler);
      setFilteredHistory(customerIslemler);
    } catch (error) {
      console.error('Müşteri geçmişi yüklenirken hata:', error);
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [islemler]);

  const handleCloseHistoryDialog = useCallback(() => {
    setHistoryDialogOpen(false);
    setCustomerHistory([]);
    setFilteredHistory([]);
    setSelectedCustomerName('');
    setHistoryFilters({
      sira: '',
      tarih: '',
      ilce: '',
      mahalle: '',
      cadde: '',
      sokak: '',
      kapi_no: '',
      cep_tel: '',
      urun: '',
      marka: '',
      sikayet: '',
      yapilan_islem: '',
      teknisyen: '',
      tutar: '',
      durum: '',
    });
  }, []);

  // Müşteri geçmişi filtreleme fonksiyonu
  const handleHistoryFilterChange = useCallback((field: string, value: string) => {
    const newFilters = { ...historyFilters, [field]: value };
    setHistoryFilters(newFilters);

    const filtered = customerHistory.filter((islem) => {
      // ID bazlı sabit sıra
      const siraNo = islem.id;

      return (
        (!newFilters.sira || siraNo.toString().includes(newFilters.sira)) &&
        (!newFilters.tarih || (islem.full_tarih && new Date(islem.full_tarih).toLocaleDateString('tr-TR').includes(newFilters.tarih))) &&
        (!newFilters.ilce || (islem.ilce && islem.ilce.toLowerCase().includes(newFilters.ilce.toLowerCase()))) &&
        (!newFilters.mahalle || (islem.mahalle && islem.mahalle.toLowerCase().includes(newFilters.mahalle.toLowerCase()))) &&
        (!newFilters.cadde || (islem.cadde && islem.cadde.toLowerCase().includes(newFilters.cadde.toLowerCase()))) &&
        (!newFilters.sokak || (islem.sokak && islem.sokak.toLowerCase().includes(newFilters.sokak.toLowerCase()))) &&
        (!newFilters.kapi_no || (islem.kapi_no && islem.kapi_no.toLowerCase().includes(newFilters.kapi_no.toLowerCase()))) &&
        (!newFilters.cep_tel || (islem.cep_tel && islem.cep_tel.includes(newFilters.cep_tel))) &&
        (!newFilters.urun || (islem.urun && islem.urun.toLowerCase().includes(newFilters.urun.toLowerCase()))) &&
        (!newFilters.marka || (islem.marka && islem.marka.toLowerCase().includes(newFilters.marka.toLowerCase()))) &&
        (!newFilters.sikayet || (islem.sikayet && islem.sikayet.toLowerCase().includes(newFilters.sikayet.toLowerCase()))) &&
        (!newFilters.yapilan_islem || (islem.yapilan_islem && islem.yapilan_islem.toLowerCase().includes(newFilters.yapilan_islem.toLowerCase()))) &&
        (!newFilters.teknisyen || (islem.teknisyen_ismi && islem.teknisyen_ismi.toLowerCase().includes(newFilters.teknisyen.toLowerCase()))) &&
        (!newFilters.tutar || (islem.tutar && islem.tutar.toString().includes(newFilters.tutar))) &&
        (!newFilters.durum || (islem.is_durumu && (
          (newFilters.durum.toLowerCase() === 'açık' && islem.is_durumu === 'acik') ||
          (newFilters.durum.toLowerCase() === 'parça bekliyor' && islem.is_durumu === 'parca_bekliyor') ||
          (newFilters.durum.toLowerCase() === 'tamamlandı' && islem.is_durumu === 'tamamlandi') ||
          (newFilters.durum.toLowerCase() === 'iptal' && islem.is_durumu === 'iptal') ||
          (newFilters.durum.toLowerCase() === 'acik' && islem.is_durumu === 'acik') ||
          (newFilters.durum.toLowerCase() === 'parca_bekliyor' && islem.is_durumu === 'parca_bekliyor') ||
          (newFilters.durum.toLowerCase() === 'tamamlandi' && islem.is_durumu === 'tamamlandi')
        )))
      );
    });

    setFilteredHistory(filtered);
  }, [historyFilters, customerHistory]);

  // Sütun sırasını localStorage'dan yükle
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('islemTableColumnOrder');
    const defaultOrder = [
      'tarih', 'ad_soyad', 'ilce', 'mahalle', 'apartman_site', 'blok_no', 'daire_no', 
      'cep_tel', 'yedek_tel', 'cadde', 'sokak', 'kapi_no',
      'urun', 'marka', 'sikayet', 'yapilan_islem', 'teknisyen', 'tutar', 'durum', 'islemler'
    ];
    
    if (saved) {
      const parsedOrder = JSON.parse(saved);
      // Eğer kaydedilen sütun sayısı varsayılan sütun sayısından farklıysa, varsayılanı kullan
      if (parsedOrder.length !== defaultOrder.length) {
        localStorage.removeItem('islemTableColumnOrder');
        return defaultOrder;
      }
      return parsedOrder;
    }
    return defaultOrder;
  });

  // Sütun genişliklerini localStorage'dan yükle
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('islemTableColumnWidths');
    const defaultWidths: Record<string, number> = {
      sira: 35,
      tarih: 90,
      ad_soyad: 140,
      ilce: 100,
      mahalle: 120,
      cadde: 120,
      sokak: 100,
      kapi_no: 60,
      apartman_site: 120,
      blok_no: 60,
      daire_no: 60,
      cep_tel: 110,
      yedek_tel: 110,
      urun: 120,
      marka: 100,
      sikayet: 180,
      yapilan_islem: 180,
      teknisyen: 100,
      tutar: 80,
      durum: 120,
      islemler: 100,
    };
    
    if (saved) {
      return { ...defaultWidths, ...JSON.parse(saved) };
    }
    return defaultWidths;
  });

  // Resize state
  const [resizing, setResizing] = useState<{ columnId: string; startX: number; startWidth: number } | null>(null);

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Drag event'ini engelle
    const startX = e.clientX;
    const startWidth = columnWidths[columnId] || 100;
    setResizing({ columnId, startX, startWidth });
  };

  // Mouse move handler
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing) {
        const diff = e.clientX - resizing.startX;
        const newWidth = Math.max(40, resizing.startWidth + diff); // Min 40px
        setColumnWidths(prev => ({
          ...prev,
          [resizing.columnId]: newWidth
        }));
      }
    };

    const handleMouseUp = () => {
      if (resizing) {
        // Save to localStorage
        localStorage.setItem('islemTableColumnWidths', JSON.stringify(columnWidths));
        setResizing(null);
      }
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, columnWidths]);

  // Sütun konfigürasyonu
  const columnConfigs: Record<string, ColumnConfig> = {
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
            px: 0.2
          }}>
            {formatted}
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
  };

  // Sütun sırasını kaydet
  useEffect(() => {
    localStorage.setItem('islemTableColumnOrder', JSON.stringify(columnOrder));
  }, [columnOrder]);

  // Sütun sürükle-bırak işlemi
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(columnOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setColumnOrder(items);
  }, [columnOrder]);

  if (loading) {
    // ⚡ SKELETON LOADER: Boş ekran yerine loading animasyonu
    return (
      <TableContainer component={Paper} elevation={3}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', py: 1 }}>Sıra</TableCell>
              {columnOrder.map((colId) => (
                <TableCell key={colId} sx={{ color: 'white', py: 1 }}>
                  {columnConfigs[colId]?.label || colId}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...Array(8)].map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton variant="text" width={40} /></TableCell>
                {columnOrder.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // Mobil görünüm - Card layout
  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredIslemler.map((islem) => {
            // Sabit ID bazlı sıra - silince kaymasın
            const siraNo = islem.id;

            return (
              <Card key={islem.id} elevation={2}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip 
                      label={`Sıra: ${siraNo}`} 
                      size="small" 
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip 
                      label={
                        islem.is_durumu === 'acik' ? 'Açık' : 
                        islem.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' : 
                        'Tamamlandı'
                      }
                      size="small"
                      color={
                        islem.is_durumu === 'acik' ? 'warning' : 
                        islem.is_durumu === 'parca_bekliyor' ? 'info' : 
                        'success'
                      }
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 0.5, textTransform: 'uppercase' }}>
                    {islem.ad_soyad}
                  </Typography>
                  
                  <Grid container spacing={0.5} sx={{ fontSize: '0.75rem' }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Tarih:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">İlçe:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.ilce || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Adres:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {[islem.mahalle, islem.cadde, islem.sokak, islem.kapi_no].filter(Boolean).join(', ') || '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Cep Tel:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {formatPhoneNumber(islem.cep_tel)}
                      </Typography>
                    </Grid>
                    {islem.yedek_tel && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Yedek Tel:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {formatPhoneNumber(islem.yedek_tel)}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Ürün:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.urun || '-'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Marka:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.marka || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Şikayet:</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.sikayet || '-'}</Typography>
                    </Grid>
                    {islem.yapilan_islem && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Yapılan İşlem:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.yapilan_islem}</Typography>
                      </Grid>
                    )}
                    {islem.teknisyen_ismi && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Teknisyen:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{islem.teknisyen_ismi}</Typography>
                      </Grid>
                    )}
                    {islem.tutar && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Tutar:</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{islem.tutar} ₺</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'space-around', py: 0.5 }}>
                  {!isBayi && (
                    <>
                      <Tooltip title={
                        islem.is_durumu === 'acik' ? 'Tamamla' : 
                        islem.is_durumu === 'parca_bekliyor' ? (isAdminMode ? 'Parça Bekliyor (Düzenle)' : 'Parça Bekliyor') :
                        (isAdminMode ? 'Durumu Değiştir (Admin)' : 'Tamamlandı')
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
                            }}
                          >
                            <CheckCircle sx={{ fontSize: '1rem' }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Düzenle">
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(islem)}
                          sx={{ bgcolor: 'primary.light' }}
                        >
                          <Edit sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Müşteri Geçmişi">
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenCustomerHistory(islem.ad_soyad || '')}
                      disabled={!islem.ad_soyad}
                      sx={{ bgcolor: 'secondary.light' }}
                    >
                      <History sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Yazdır">
                    <IconButton 
                      size="small" 
                      onClick={() => handlePrintClick(islem)}
                      sx={{ bgcolor: 'info.light' }}
                    >
                      <Print sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                  {/* Sadece admin için silme butonu */}
                  {isAdminMode && onDelete && (
                    <Tooltip title="Sil (Admin)">
                      <IconButton 
                        size="small" 
                        onClick={() => onDelete(islem)}
                        sx={{ bgcolor: 'error.light' }}
                      >
                        <Delete sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            );
          })}
        </Box>

        {/* Müşteri Geçmişi Dialog - Mobil için */}
        <Dialog 
          open={historyDialogOpen} 
          onClose={handleCloseHistoryDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            Müşteri Geçmişi: {selectedCustomerName}
          </DialogTitle>
          <DialogContent>
            {historyLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : customerHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Bu müşteri için kayıt bulunamadı.
              </Typography>
            ) : (
              <>
                {/* Filtreleme Alanı - Mobil */}
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Ara... (Tarih, Ürün, Marka, Şikayet, vb.)"
                    value={historyFilters.sikayet}
                    onChange={(e) => handleHistoryFilterChange('sikayet', e.target.value)}
                    fullWidth
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' } }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {filteredHistory.map((record) => {
                    // ID bazlı sabit sıra
                    const siraNo = record.id;
                    
                    return (
                    <Card key={record.id} variant="outlined">
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                        Sıra #{siraNo} - {record.full_tarih ? new Date(record.full_tarih).toLocaleDateString('tr-TR') : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 0.5 }}>
                        <strong>Ürün:</strong> {record.urun} - {record.marka}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        <strong>Şikayet:</strong> {record.sikayet}
                      </Typography>
                      {record.yapilan_islem && (
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>Yapılan İşlem:</strong> {record.yapilan_islem}
                        </Typography>
                      )}
                      <Chip 
                        label={
                          record.is_durumu === 'acik' ? 'Açık' :
                          record.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' :
                          record.is_durumu === 'iptal' ? 'İptal' :
                          'Tamamlandı'
                        }
                        size="small"
                        color={
                          record.is_durumu === 'acik' ? 'warning' :
                          record.is_durumu === 'iptal' ? 'error' :
                          'success'
                        }
                        sx={{ mt: 0.5 }}
                      />
                    </CardContent>
                  </Card>
                  );
                })}
                </Box>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Print Editor Dialog */}
        {selectedIslemForPrint && (
          <PrintEditor
            open={printEditorOpen}
            onClose={handlePrintClose}
            islem={selectedIslemForPrint}
          />
        )}
      </>
    );
  }

  // Masaüstü görünüm - Table layout
  return (
    <>
    <TableContainer component={Paper} elevation={3} sx={{ maxWidth: '100vw', overflowX: 'auto' }}>
      <Table size="small" sx={{ 
        fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
        fontWeight: 500,
        '& .MuiTableCell-root': { 
          py: 0.2, 
          px: 0.3, 
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
          lineHeight: 1.2,
          borderRight: '1px solid #030303ff',
          borderBottom: '2px solid #000000ff',
          fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
          fontWeight: 500,
          '&:last-child': {
            borderRight: 'none'
          }
        } 
      }}>
        <TableHead>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <TableRow 
                  sx={{ bgcolor: 'primary.main' }}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {/* Sıra No başlığı (draggable değil) */}
                  <TableCell sx={{ 
                    color: 'white', 
                    fontWeight: 600, 
                    fontSize: '0.65rem', 
                    py: 0.1, 
                    px: 0.2, 
                    width: columnWidths.sira,
                    minWidth: columnWidths.sira,
                    maxWidth: columnWidths.sira,
                    position: 'relative',
                  }}>
                    Sıra
                    {/* Resize Handle */}
                    <Box
                      onMouseDown={(e) => handleResizeStart(e, 'sira')}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        userSelect: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.3)',
                        },
                      }}
                    />
                  </TableCell>
                  {columnOrder.map((columnId, index) => {
                    const column = columnConfigs[columnId];
                    return (
                      <Draggable 
                        key={columnId} 
                        draggableId={columnId} 
                        index={index}
                        isDragDisabled={!!resizing}
                      >
                        {(provided, snapshot) => (
                          <TableCell
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              cursor: resizing ? 'col-resize' : (!snapshot.isDragging ? 'move' : 'grab'),
                              userSelect: 'none',
                              bgcolor: snapshot.isDragging ? 'primary.dark' : 'primary.main',
                              py: 0.1,
                              px: 0.2,
                              width: columnWidths[columnId],
                              minWidth: columnWidths[columnId],
                              maxWidth: columnWidths[columnId],
                              position: 'relative',
                              borderRight: '2px solid rgba(255, 255, 255, 0.3)',
                              '&:hover': {
                                bgcolor: 'primary.dark',
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.2 }}>
                              <DragIndicator sx={{ fontSize: '0.7rem', opacity: 0.7 }} />
                              <span style={{ fontSize: '0.65rem' }}>{column.label}</span>
                            </Box>
                            {/* Resize Handle */}
                            <Box
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeStart(e, columnId);
                              }}
                              sx={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '8px',
                                cursor: 'col-resize',
                                userSelect: 'none',
                                zIndex: 10,
                                backgroundColor: 'transparent',
                                transition: 'background-color 0.2s',
                                '&:hover': {
                                  backgroundColor: 'rgba(255,255,255,0.5)',
                                },
                              }}
                            />
                          </TableCell>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </TableRow>
              )}
            </Droppable>
          </DragDropContext>
          {/* Filter Row */}
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            <TableCell sx={{ 
              py: 0.2, 
              px: 0.2,
              width: columnWidths.sira,
              minWidth: columnWidths.sira,
              maxWidth: columnWidths.sira,
              borderRight: '1px solid rgba(224, 224, 224, 0.6)',
            }}>
              <TextField
                size="small"
                placeholder="Sıra"
                value={filters.sira}
                onChange={(e) => handleFilterChange('sira', e.target.value)}
                sx={{
                  '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 },
                  width: '100%'
                }}
              />
            </TableCell>
            {columnOrder.map((columnId) => (
              <TableCell key={columnId} sx={{ 
                py: 0.2, 
                px: 0.2,
                width: columnWidths[columnId],
                minWidth: columnWidths[columnId],
                maxWidth: columnWidths[columnId],
                borderRight: '1px solid rgba(224, 224, 224, 0.6)',
              }}>
                {columnId !== 'islemler' && columnId !== 'yedek_tel' ? (
                  <TextField
                    size="small"
                    placeholder={`${columnConfigs[columnId].label}...`}
                    value={filters[columnId as keyof typeof filters] || ''}
                    onChange={(e) => handleFilterChange(columnId, e.target.value)}
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.2, px: 0.2 },
                      width: '100%'
                    }}
                  /> 
                ) : null}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {/* ⚡ OPTIMIZED RENDERING: Sadece ilk 100 satırı göster, daha fazlası için scroll */}
        <TableBody>
          {filteredIslemler.slice(0, displayLimit).map((islem) => {
            const siraNo = islem.id;
            
            return (
            <TableRow 
              key={islem.id} 
              hover
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(13, 50, 130, 0.04)',
                }
              }}
            >
              <TableCell sx={{ 
                fontWeight: 500, 
                fontSize: '0.65rem', 
                py: 0.1, 
                px: 0.2, 
                textAlign: 'center',
                width: columnWidths.sira,
                minWidth: columnWidths.sira,
                maxWidth: columnWidths.sira,
                borderRight: '1px solid rgba(224, 224, 224, 0.5)',
              }}>
                {siraNo}
              </TableCell>
              {columnOrder.map((columnId) => {
                const column = columnConfigs[columnId];
                const cell = column.render(islem);
                const width = columnWidths[columnId];
                
                // Width'i cell'e ekle
                return React.cloneElement(cell as React.ReactElement, {
                  key: columnId,
                  sx: {
                    ...(cell as React.ReactElement).props.sx,
                    width,
                    minWidth: width,
                    maxWidth: width,
                    borderRight: '1px solid rgba(224, 224, 224, 0.5)',
                  }
                });
              })}
            </TableRow>
          );
          })}
          {/* Daha fazla göster satırı */}
          {filteredIslemler.length > displayLimit && (
            <TableRow>
              <TableCell colSpan={columnOrder.length + 1} sx={{ textAlign: 'center', py: 2 }}>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setDisplayLimit(prev => prev + 100)}
                >
                  Daha Fazla Göster ({filteredIslemler.length - displayLimit} kayıt daha)
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>

    {/* Müşteri Geçmişi Dialog */}
    <Dialog 
      open={historyDialogOpen} 
      onClose={handleCloseHistoryDialog}
      maxWidth="xl"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Müşteri Geçmişi: {selectedCustomerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Toplam {customerHistory.length} kayıt
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : customerHistory.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Bu müşteri için kayıt bulunamadı.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small" sx={{ 
              '& .MuiTableCell-root': { 
                py: 0.5, 
                px: 1, 
                fontSize: '0.75rem',
                borderRight: '2px solid #e0e0e0',
                borderBottom: '2px solid #e0e0e0',
                '&:last-child': {
                  borderRight: 'none'
                }
              } 
            }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Sıra</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Tarih</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>İlçe</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Mahalle</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Cadde</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Sokak</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Kapı No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Cep Tel</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Ürün</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Marka</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Şikayet</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Yapılan İşlem</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Teknisyen</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Tutar</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>Durum</TableCell>
                </TableRow>
                {/* Filter Row */}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Sıra"
                      value={historyFilters.sira}
                      onChange={(e) => handleHistoryFilterChange('sira', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, width: '50px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Tarih"
                      value={historyFilters.tarih}
                      onChange={(e) => handleHistoryFilterChange('tarih', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="İlçe"
                      value={historyFilters.ilce}
                      onChange={(e) => handleHistoryFilterChange('ilce', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Mahalle"
                      value={historyFilters.mahalle}
                      onChange={(e) => handleHistoryFilterChange('mahalle', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Cadde"
                      value={historyFilters.cadde}
                      onChange={(e) => handleHistoryFilterChange('cadde', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Sokak"
                      value={historyFilters.sokak}
                      onChange={(e) => handleHistoryFilterChange('sokak', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Kapı"
                      value={historyFilters.kapi_no}
                      onChange={(e) => handleHistoryFilterChange('kapi_no', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, width: '50px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Cep Tel"
                      value={historyFilters.cep_tel}
                      onChange={(e) => handleHistoryFilterChange('cep_tel', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '90px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Ürün"
                      value={historyFilters.urun}
                      onChange={(e) => handleHistoryFilterChange('urun', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Marka"
                      value={historyFilters.marka}
                      onChange={(e) => handleHistoryFilterChange('marka', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Şikayet"
                      value={historyFilters.sikayet}
                      onChange={(e) => handleHistoryFilterChange('sikayet', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '100px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Yapılan"
                      value={historyFilters.yapilan_islem}
                      onChange={(e) => handleHistoryFilterChange('yapilan_islem', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '100px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Teknisyen"
                      value={historyFilters.teknisyen}
                      onChange={(e) => handleHistoryFilterChange('teknisyen', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Tutar"
                      value={historyFilters.tutar}
                      onChange={(e) => handleHistoryFilterChange('tutar', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, width: '60px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 0.2, px: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="Durum"
                      value={historyFilters.durum}
                      onChange={(e) => handleHistoryFilterChange('durum', e.target.value)}
                      sx={{ '& .MuiInputBase-input': { fontSize: '0.65rem', py: 0.3, px: 0.3 }, minWidth: '80px' }}
                    />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.map((islem) => {
                  // Sabit ID bazlı sıra - silince kaymasın
                  const siraNo = islem.id;
                  
                  return (
                  <TableRow key={islem.id} hover>
                    <TableCell>{siraNo}</TableCell>
                    <TableCell>
                      {islem.full_tarih ? new Date(islem.full_tarih).toLocaleDateString('tr-TR') : '-'}
                    </TableCell>
                    <TableCell>{islem.ilce || '-'}</TableCell>
                    <TableCell>{islem.mahalle || '-'}</TableCell>
                    <TableCell>{islem.cadde || '-'}</TableCell>
                    <TableCell>{islem.sokak || '-'}</TableCell>
                    <TableCell>{islem.kapi_no || '-'}</TableCell>
                    <TableCell>{formatPhoneNumber(islem.cep_tel)}</TableCell>
                    <TableCell>{islem.urun || '-'}</TableCell>
                    <TableCell>{islem.marka || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={islem.sikayet || '-'} placement="top">
                        <span>{islem.sikayet || '-'}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={islem.yapilan_islem || '-'} placement="top">
                        <span>{islem.yapilan_islem || '-'}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{islem.teknisyen_ismi || '-'}</TableCell>
                    <TableCell>
                      {islem.tutar ? `${Number(islem.tutar).toLocaleString('tr-TR')} ₺` : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          islem.is_durumu === 'acik' ? 'Açık' : 
                          islem.is_durumu === 'parca_bekliyor' ? 'Parça Bekliyor' : 
                          islem.is_durumu === 'iptal' ? 'İptal' :
                          'Tamamlandı'
                        }
                        color={
                          islem.is_durumu === 'acik' ? 'warning' : 
                          islem.is_durumu === 'parca_bekliyor' ? 'info' : 
                          islem.is_durumu === 'iptal' ? 'error' :
                          'success'
                        }
                        size="small"
                        sx={{ fontSize: '0.65rem', height: '20px' }}
                      />
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>

    {/* Yazdırma Düzenleyici */}
    {selectedIslemForPrint && (
      <PrintEditor
        open={printEditorOpen}
        onClose={handleClosePrintEditor}
        islem={selectedIslemForPrint}
      />
    )}
    </>
  );
};

export default memo(IslemTable);
