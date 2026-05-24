import React, { useState, useEffect, useMemo, useCallback, memo, startTransition } from 'react';
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
  Box,
  Tooltip,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';

// ⚡ Kendi state'ini yöneten debounced input - parent'ı her tuşta render etmez
import DebouncedFilterInput from './table/DebouncedFilterInput';
import IslemTableLoadingState from './table/IslemTableLoadingState';
import { formatPhoneNumber } from './table/islemTableUtils';
import CustomerHistoryDialog from './table/CustomerHistoryDialog';
import KaralisteConfirmDialog from './table/KaralisteConfirmDialog';
import IslemMobileCard from './table/IslemMobileCard';
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
import { Islem } from '../../types';
import PrintEditor from '../settings/PrintEditor';
import { islemService } from '../../services/islem.service';
import { karalisteService } from '../../services/karaliste.service';
import { STORAGE_KEYS } from '../../constants/storageKeys';

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
  onColumnFiltersChange?: (filters: Record<string, string>) => void; // Kolon filtreleri değiştiğinde callback
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
  onColumnFiltersChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [printEditorOpen, setPrintEditorOpen] = useState(false);
  const [selectedIslemForPrint, setSelectedIslemForPrint] = useState<Islem | null>(null);
  
  // Müşteri Geçmişi Dialog states
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<Islem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Islem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  
  // Karaliste state
  const [karalisteDialogOpen, setKaralisteDialogOpen] = useState(false);
  const [karalisteLoading, setKaralisteLoading] = useState(false);

  // ⚡ Performance: Render limiti - büyük verilerde kasma önlenir
  const DISPLAY_CHUNK = 150;
  const [displayLimit, setDisplayLimit] = useState(DISPLAY_CHUNK);
  
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
  
  // ⚡ Filter state - sadece debounced input'lardan güncellenir, her tuşta değişmez
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

  // ⚡ Pre-computed lowercase search index - islemler değişince bir kez hesaplanır
  const searchIndex = useMemo(() => {
    return islemler.map(item => ({
      id: item.id,
      idStr: item.id.toString(),
      tarih: item.full_tarih ? new Date(item.full_tarih).toLocaleDateString('tr-TR') : '',
      ad_soyad: (item.ad_soyad || '').toLocaleLowerCase('tr-TR'),
      ilce: (item.ilce || '').toLocaleLowerCase('tr-TR'),
      mahalle: (item.mahalle || '').toLocaleLowerCase('tr-TR'),
      cadde: (item.cadde || '').toLocaleLowerCase('tr-TR'),
      sokak: (item.sokak || '').toLocaleLowerCase('tr-TR'),
      kapi_no: (item.kapi_no || '').toLocaleLowerCase('tr-TR'),
      apartman_site: (item.apartman_site || '').toLocaleLowerCase('tr-TR'),
      blok_no: (item.blok_no || '').toLocaleLowerCase('tr-TR'),
      daire_no: (item.daire_no || '').toLocaleLowerCase('tr-TR'),
      cep_tel: (item.cep_tel || '').replace(/\D/g, ''),
      yedek_tel: (item.yedek_tel || '').replace(/\D/g, ''),
      urun: (item.urun || '').toLocaleLowerCase('tr-TR'),
      marka: (item.marka || '').toLocaleLowerCase('tr-TR'),
      sikayet: (item.sikayet || '').toLocaleLowerCase('tr-TR'),
      yapilan_islem: (item.yapilan_islem || '').toLocaleLowerCase('tr-TR'),
      teknisyen: (item.teknisyen_ismi || '').toLocaleLowerCase('tr-TR'),
      tutar: item.tutar?.toString() || '',
      durum: item.is_durumu === 'tamamlandi' ? 'tamamlandı' :
             item.is_durumu === 'parca_bekliyor' ? 'parça bekliyor' :
             item.is_durumu === 'iptal' ? 'iptal' : 'açık',
    }));
  }, [islemler]);

  // ⚡ Optimized filtering - pre-computed index ile tek geçişte filtreler
  const filteredIslemler = useMemo(() => {
    const f = filters;
    const hasAnyFilter = f.sira || f.tarih || f.ad_soyad || f.ilce || f.mahalle ||
      f.cadde || f.sokak || f.kapi_no || f.apartman_site || f.blok_no ||
      f.daire_no || f.cep_tel || f.urun || f.marka || f.sikayet ||
      f.yapilan_islem || f.teknisyen || f.tutar || f.durum;

    if (!hasAnyFilter) return islemler;

    // Filtre değerlerini bir kez lowercase'e çevir
    const fLower = {
      ad_soyad: f.ad_soyad ? f.ad_soyad.toLocaleLowerCase('tr-TR') : '',
      ilce: f.ilce ? f.ilce.toLocaleLowerCase('tr-TR') : '',
      mahalle: f.mahalle ? f.mahalle.toLocaleLowerCase('tr-TR') : '',
      cadde: f.cadde ? f.cadde.toLocaleLowerCase('tr-TR') : '',
      sokak: f.sokak ? f.sokak.toLocaleLowerCase('tr-TR') : '',
      kapi_no: f.kapi_no ? f.kapi_no.toLocaleLowerCase('tr-TR') : '',
      apartman_site: f.apartman_site ? f.apartman_site.toLocaleLowerCase('tr-TR') : '',
      blok_no: f.blok_no ? f.blok_no.toLocaleLowerCase('tr-TR') : '',
      daire_no: f.daire_no ? f.daire_no.toLocaleLowerCase('tr-TR') : '',
      urun: f.urun ? f.urun.toLocaleLowerCase('tr-TR') : '',
      marka: f.marka ? f.marka.toLocaleLowerCase('tr-TR') : '',
      sikayet: f.sikayet ? f.sikayet.toLocaleLowerCase('tr-TR') : '',
      yapilan_islem: f.yapilan_islem ? f.yapilan_islem.toLocaleLowerCase('tr-TR') : '',
      teknisyen: f.teknisyen ? f.teknisyen.toLocaleLowerCase('tr-TR') : '',
      durum: f.durum ? f.durum.toLowerCase() : '',
    };
    const cleanPhone = f.cep_tel ? f.cep_tel.replace(/\D/g, '') : '';

    const result: Islem[] = [];
    for (let i = 0; i < islemler.length; i++) {
      const idx = searchIndex[i];
      if (!idx) continue;

      if (f.sira && !idx.idStr.includes(f.sira)) continue;
      if (f.tarih && !idx.tarih.includes(f.tarih)) continue;
      if (fLower.ad_soyad && !idx.ad_soyad.includes(fLower.ad_soyad)) continue;
      if (fLower.ilce && !idx.ilce.includes(fLower.ilce)) continue;
      if (fLower.mahalle && !idx.mahalle.includes(fLower.mahalle)) continue;
      if (fLower.cadde && !idx.cadde.includes(fLower.cadde)) continue;
      if (fLower.sokak && !idx.sokak.includes(fLower.sokak)) continue;
      if (fLower.kapi_no && !idx.kapi_no.includes(fLower.kapi_no)) continue;
      if (fLower.apartman_site && !idx.apartman_site.includes(fLower.apartman_site)) continue;
      if (fLower.blok_no && !idx.blok_no.includes(fLower.blok_no)) continue;
      if (fLower.daire_no && !idx.daire_no.includes(fLower.daire_no)) continue;
      if (cleanPhone && !idx.cep_tel.includes(cleanPhone) && !idx.yedek_tel.includes(cleanPhone)) continue;
      if (fLower.urun && !idx.urun.includes(fLower.urun)) continue;
      if (fLower.marka && !idx.marka.includes(fLower.marka)) continue;
      if (fLower.sikayet && !idx.sikayet.includes(fLower.sikayet)) continue;
      if (fLower.yapilan_islem && !idx.yapilan_islem.includes(fLower.yapilan_islem)) continue;
      if (fLower.teknisyen && !idx.teknisyen.includes(fLower.teknisyen)) continue;
      if (f.tutar && !idx.tutar.includes(f.tutar)) continue;
      if (fLower.durum && !idx.durum.includes(fLower.durum)) continue;

      result.push(islemler[i]);
    }
    return result;
  }, [islemler, filters, searchIndex]);

  // Filtrelenmiş liste değiştiğinde parent'a bildir ve displayLimit sıfırla
  // ⚡ startTransition: parent güncellemesi düşük öncelikli yapılır, input donmaz
  useEffect(() => {
    setDisplayLimit(DISPLAY_CHUNK);
    startTransition(() => {
      if (onFilteredChange) {
        onFilteredChange(filteredIslemler);
      }
    });
  }, [filteredIslemler, onFilteredChange]);

  // ⚡ Ekranda gösterilecek satırlar (performans için sınırlı)
  const visibleIslemler = useMemo(() => filteredIslemler.slice(0, displayLimit), [filteredIslemler, displayLimit]);

  // Kolon filtreleri değiştiğinde parent'a bildir (server-side arama için)
  useEffect(() => {
    if (onColumnFiltersChange) {
      onColumnFiltersChange(filters);
    }
  }, [filters, onColumnFiltersChange]);

  const handleFilterChange = useCallback((field: string, value: string) => {
    startTransition(() => {
      setFilters((prev) => ({ ...prev, [field]: value }));
    });
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
      await islemService.update(islem.id, { ...islem, yazdirildi: newYazdirildi });
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
      const customerIslemler = await islemService.searchByName(customerName);
      // En yeni en üstte sırala (ID'ye göre azalan)
      const sorted = customerIslemler.sort((a, b) => b.id - a.id);
      
      setCustomerHistory(sorted);
      setFilteredHistory(sorted);
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
    setKaralisteDialogOpen(false);
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

  // Karalisteye ekleme handler
  const handleAddToKaraliste = useCallback(async () => {
    if (customerHistory.length === 0) return;
    setKaralisteLoading(true);
    try {
      const firstRecord = customerHistory[0];
      await karalisteService.add({
        ad_soyad: firstRecord.ad_soyad,
        cep_tel: firstRecord.cep_tel,
        yedek_tel: firstRecord.yedek_tel,
        mahalle: firstRecord.mahalle,
        cadde: firstRecord.cadde,
        sokak: firstRecord.sokak,
        kapi_no: firstRecord.kapi_no,
      });
      alert('Müşteri karalisteye eklendi!');
      setKaralisteDialogOpen(false);
    } catch (error) {
      console.error('Karaliste ekleme hatası:', error);
      alert('Karalisteye eklerken hata oluştu!');
    } finally {
      setKaralisteLoading(false);
    }
  }, [customerHistory]);

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
    const saved = localStorage.getItem(STORAGE_KEYS.ISLEM_TABLE_COLUMN_ORDER);
    const defaultOrder = [
      'tarih', 'ad_soyad', 'ilce', 'mahalle', 'apartman_site', 'blok_no', 'daire_no', 
      'cep_tel', 'yedek_tel', 'cadde', 'sokak', 'kapi_no',
      'urun', 'marka', 'sikayet', 'yapilan_islem', 'teknisyen', 'tutar', 'durum', 'islemler'
    ];
    
    if (saved) {
      const parsedOrder = JSON.parse(saved);
      // Eğer kaydedilen sütun sayısı varsayılan sütun sayısından farklıysa, varsayılanı kullan
      if (parsedOrder.length !== defaultOrder.length) {
        localStorage.removeItem(STORAGE_KEYS.ISLEM_TABLE_COLUMN_ORDER);
        return defaultOrder;
      }
      return parsedOrder;
    }
    return defaultOrder;
  });

  // Sütun genişliklerini localStorage'dan yükle
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ISLEM_TABLE_COLUMN_WIDTHS);
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
        localStorage.setItem(STORAGE_KEYS.ISLEM_TABLE_COLUMN_WIDTHS, JSON.stringify(columnWidths));
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

  // ⚡ Sütun konfigürasyonu - useMemo ile sadece callback'ler değişince yeniden oluştur
  const columnConfigs: Record<string, ColumnConfig> = useMemo(() => ({
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
  }), [onEdit, onClone, onToggleDurum, onDelete, isBayi, isAdminMode]);

  // Sütun sırasını kaydet
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ISLEM_TABLE_COLUMN_ORDER, JSON.stringify(columnOrder));
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
      <IslemTableLoadingState
        columnOrder={columnOrder}
        columnConfigs={columnConfigs}
      />
    );
  }

  // Mobil görünüm - Card layout
  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleIslemler.map((islem) => (
            <IslemMobileCard
              key={islem.id}
              islem={islem}
              isAdminMode={isAdminMode}
              isBayi={isBayi}
              onToggleDurum={onToggleDurum}
              onEdit={onEdit}
              onDelete={onDelete}
              onOpenHistory={handleOpenCustomerHistory}
              onPrint={handlePrintClick}
            />
          ))}
        </Box>
        {/* ⚡ Mobil "Daha Fazla Göster" */}
        {displayLimit < filteredIslemler.length && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setDisplayLimit(prev => prev + DISPLAY_CHUNK)}
              sx={{ color: '#0D3282', fontSize: '0.8rem' }}
            >
              Daha Fazla Göster ({visibleIslemler.length} / {filteredIslemler.length})
            </Button>
          </Box>
        )}

        {/* Müşteri Geçmişi Dialog - Mobil için */}
        <CustomerHistoryDialog
          open={historyDialogOpen}
          onClose={handleCloseHistoryDialog}
          customerName={selectedCustomerName}
          customerHistory={customerHistory}
          filteredHistory={filteredHistory}
          loading={historyLoading}
          filters={historyFilters}
          onFilterChange={(f, v) => handleHistoryFilterChange(f, v)}
          onOpenKaraliste={() => setKaralisteDialogOpen(true)}
          isMobile
        />

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
              <DebouncedFilterInput
                placeholder="Sıra"
                onChange={(v) => handleFilterChange('sira', v)}
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
                  <DebouncedFilterInput
                    placeholder={`${columnConfigs[columnId].label}...`}
                    onChange={(v) => handleFilterChange(columnId, v)}
                  />
                ) : null}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {/* ⚡ OPTIMIZED RENDERING: Performans için satır limiti */}
        <TableBody>
          {visibleIslemler.map((islem) => {
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
        </TableBody>
      </Table>
    </TableContainer>
    {/* ⚡ Tablo içi "Daha Fazla Göster" - render limiti aşıldıysa */}
    {displayLimit < filteredIslemler.length && (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 1 }}>
        <Button
          variant="text"
          size="small"
          onClick={() => setDisplayLimit(prev => prev + DISPLAY_CHUNK)}
          sx={{ color: '#0D3282', fontSize: '0.8rem' }}
        >
          Daha Fazla Göster ({visibleIslemler.length} / {filteredIslemler.length})
        </Button>
      </Box>
    )}

    {/* Müşteri Geçmişi Dialog */}
    <CustomerHistoryDialog
      open={historyDialogOpen}
      onClose={handleCloseHistoryDialog}
      customerName={selectedCustomerName}
      customerHistory={customerHistory}
      filteredHistory={filteredHistory}
      loading={historyLoading}
      filters={historyFilters}
      onFilterChange={(f, v) => handleHistoryFilterChange(f, v)}
      onOpenKaraliste={() => setKaralisteDialogOpen(true)}
      isMobile={false}
    />

    {/* Karaliste Onay Dialog */}
    <KaralisteConfirmDialog
      open={karalisteDialogOpen}
      onClose={() => setKaralisteDialogOpen(false)}
      customerName={selectedCustomerName}
      loading={karalisteLoading}
      onConfirm={handleAddToKaraliste}
    />

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
