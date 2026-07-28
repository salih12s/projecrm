import React, { useState, useEffect, useMemo, useCallback, memo, startTransition, lazy, Suspense } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material';

// ⚡ Kendi state'ini yöneten debounced input - parent'ı her tuşta render etmez
import DebouncedFilterInput from './table/DebouncedFilterInput';
import IslemTableLoadingState from './table/IslemTableLoadingState';
import CustomerHistoryDialog from './table/CustomerHistoryDialog';
import KaralisteConfirmDialog from './table/KaralisteConfirmDialog';
import IslemMobileCard from './table/IslemMobileCard';
import IslemTableRow from './table/IslemTableRow';
import { createIslemColumnConfigs, ColumnConfig } from './table/islemColumnConfigs';
import { normalizeTr } from './table/islemTableUtils';
import {
  DragIndicator,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Islem } from '../../types';
// ⚡ PrintEditor sadece yazdırma dialogu açılınca gerekiyor; ana bundle'dan çıkar.
const PrintEditor = lazy(() => import('../settings/PrintEditor'));
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

  // ⚡ Yazdırıldı simgesi için optimistic değerler: { islemId: yeniDeger }
  const [yazdirildiOverrides, setYazdirildiOverrides] = useState<Record<number, boolean>>({});
  
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

  // ⚡ Hiçbir filtre yokken arama indeksini HİÇ kurma.
  // Eskiden `islemler` her değiştiğinde (her socket olayında!) 11.000 × 20
  // alan için `toLocaleLowerCase('tr-TR')` çalışıyordu ≈ 550 ms donma.
  const hasAnyFilter = useMemo(() => {
    const f = filters;
    return Boolean(
      f.sira || f.tarih || f.ad_soyad || f.ilce || f.mahalle ||
      f.cadde || f.sokak || f.kapi_no || f.apartman_site || f.blok_no ||
      f.daire_no || f.cep_tel || f.urun || f.marka || f.sikayet ||
      f.yapilan_islem || f.teknisyen || f.tutar || f.durum
    );
  }, [filters]);

  // ⚡ Pre-computed lowercase search index - sadece filtre varken hesaplanır
  const searchIndex = useMemo(() => {
    if (!hasAnyFilter) return null;
    return islemler.map(item => ({
      id: item.id,
      idStr: item.id.toString(),
      tarih: item.full_tarih ? new Date(item.full_tarih).toLocaleDateString('tr-TR') : '',
      ad_soyad: normalizeTr(item.ad_soyad),
      ilce: normalizeTr(item.ilce),
      mahalle: normalizeTr(item.mahalle),
      cadde: normalizeTr(item.cadde),
      sokak: normalizeTr(item.sokak),
      kapi_no: normalizeTr(item.kapi_no),
      apartman_site: normalizeTr(item.apartman_site),
      blok_no: normalizeTr(item.blok_no),
      daire_no: normalizeTr(item.daire_no),
      cep_tel: (item.cep_tel || '').replace(/\D/g, ''),
      yedek_tel: (item.yedek_tel || '').replace(/\D/g, ''),
      urun: normalizeTr(item.urun),
      marka: normalizeTr(item.marka),
      sikayet: normalizeTr(item.sikayet),
      yapilan_islem: normalizeTr(item.yapilan_islem),
      teknisyen: normalizeTr(item.teknisyen_ismi),
      tutar: item.tutar?.toString() || '',
      durum: item.is_durumu === 'tamamlandi' ? 'tamamlandı' :
             item.is_durumu === 'parca_bekliyor' ? 'parça bekliyor' :
             item.is_durumu === 'iptal' ? 'iptal' : 'açık',
    }));
  }, [islemler, hasAnyFilter]);

  // ⚡ Optimized filtering - pre-computed index ile tek geçişte filtreler
  const filteredIslemler = useMemo(() => {
    const f = filters;
    if (!hasAnyFilter || !searchIndex) return islemler;

    // Filtre değerlerini bir kez lowercase'e çevir
    const fLower = {
      ad_soyad: normalizeTr(f.ad_soyad),
      ilce: normalizeTr(f.ilce),
      mahalle: normalizeTr(f.mahalle),
      cadde: normalizeTr(f.cadde),
      sokak: normalizeTr(f.sokak),
      kapi_no: normalizeTr(f.kapi_no),
      apartman_site: normalizeTr(f.apartman_site),
      blok_no: normalizeTr(f.blok_no),
      daire_no: normalizeTr(f.daire_no),
      urun: normalizeTr(f.urun),
      marka: normalizeTr(f.marka),
      sikayet: normalizeTr(f.sikayet),
      yapilan_islem: normalizeTr(f.yapilan_islem),
      teknisyen: normalizeTr(f.teknisyen),
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
  }, [islemler, filters, searchIndex, hasAnyFilter]);

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

  // ⚡ Yazdırıldı durumunu toggle et — OPTIMISTIC.
  // Eskiden: tüm satır PUT ediliyor, cevap değil socket olayı bekleniyordu;
  // simge ancak sunucu turu + tablonun tamamen yeniden render'ı bittikten
  // sonra (~2 sn) değişiyordu. Artık simge anında değişir, ağ isteği arkada
  // gider, hata olursa geri alınır.
  const handleToggleYazdirildi = useCallback(async (islem: Islem, event: React.MouseEvent) => {
    event.stopPropagation(); // Satır tıklamasını engelle
    const newYazdirildi = !islem.yazdirildi;

    setYazdirildiOverrides((prev) => ({ ...prev, [islem.id]: newYazdirildi }));

    try {
      await islemService.toggleYazdirildi(islem.id, newYazdirildi);
      // Gerçek kayıt socket üzerinden gelecek; override'ı bırakıyoruz ki
      // socket gecikirse simge geri zıplamasın. Prop'taki değer yakaladığında
      // aşağıdaki effect override'ı temizler.
    } catch (error) {
      console.error('Yazdırıldı durumu güncellenirken hata:', error);
      // Başarısızsa optimistic değeri geri al
      setYazdirildiOverrides((prev) => {
        const next = { ...prev };
        delete next[islem.id];
        return next;
      });
    }
  }, []);

  // Sunucudan gelen değer optimistic değeri yakaladığında override'ı düşür —
  // aksi halde başka bir kullanıcının aynı satırda yaptığı değişikliği
  // maskelerdik. Türetilmiş değer olarak hesaplanıyor (effect + setState
  // yerine) ki fazladan render turu olmasın.
  const activeYazdirildiOverrides = useMemo(() => {
    if (Object.keys(yazdirildiOverrides).length === 0) return yazdirildiOverrides;

    const serverValueById = new Map(islemler.map((i) => [i.id, Boolean(i.yazdirildi)]));
    const next: Record<number, boolean> = {};
    let dropped = false;

    for (const [idStr, value] of Object.entries(yazdirildiOverrides)) {
      const id = Number(idStr);
      if (serverValueById.get(id) === value) {
        dropped = true; // sunucu yakaladı, override'a gerek yok
        continue;
      }
      next[id] = value;
    }

    return dropped ? next : yazdirildiOverrides;
  }, [yazdirildiOverrides, islemler]);

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
  // Sutun konfigurasyonu - useMemo ile sadece callback'ler degisince yeniden olustur
  const columnConfigs: Record<string, ColumnConfig> = useMemo(() => createIslemColumnConfigs({
    onEdit, onClone, onToggleDurum, onDelete, isAdminMode, isBayi,
    setSelectedIslemForPrint, setPrintEditorOpen,
    handleOpenCustomerHistory, handleToggleYazdirildi,
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
          <Suspense fallback={null}>
            <PrintEditor
              open={printEditorOpen}
              onClose={handlePrintClose}
              islem={selectedIslemForPrint}
            />
          </Suspense>
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
          {visibleIslemler.map((islem) => (
            <IslemTableRow
              key={islem.id}
              islem={islem}
              columnOrder={columnOrder}
              columnConfigs={columnConfigs}
              columnWidths={columnWidths}
              yazdirildiOverride={activeYazdirildiOverrides[islem.id]}
            />
          ))}
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
      <Suspense fallback={null}>
        <PrintEditor
          open={printEditorOpen}
          onClose={handleClosePrintEditor}
          islem={selectedIslemForPrint}
        />
      </Suspense>
    )}
    </>
  );
};

export default memo(IslemTable);
