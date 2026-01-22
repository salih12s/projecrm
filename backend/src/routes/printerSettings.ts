import { Router, Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';

const router = Router();

// Türkçe karakterleri doğru normalize et (büyük/küçük harf duyarsız)
// Tüm Latin harflerini ve Türkçe karakterleri standartlaştır
function normalizeTurkish(str: string): string {
  return str
    .trim()
    .toLowerCase() // Önce küçük harfe çevir
    .normalize('NFD') // Unicode normalizasyonu - aksanları ayır
    .replace(/[\u0300-\u036f]/g, '') // Aksanları temizle
    .replace(/ı/g, 'i') // Türkçe ı'yı i'ye çevir
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .toUpperCase(); // Sonunda büyük harfe çevir
}

// Ortak marka grupları - her grup kendi içinde aynı config'i paylaşır
const BRAND_GROUPS = [
  // Grup 1: Ferre ailesi
  { brands: ['Ferre', 'Femaş', 'General', 'Vorne'], master: 'Ferre' },
  // Grup 2: Alveus ailesi
  { brands: ['Alveus', 'Alpina', 'Cucinox', 'Exep', 'Goodwest', 'Newton', 'Punto', 'White Daisy'], master: 'Alveus' },
  // Grup 3: Daxom ailesi
  { brands: ['Daxom', 'Termomex'], master: 'Daxom' },
  // Grup 4: Çetintaş ailesi
  { brands: ['Çetintaş', 'Evii'], master: 'Çetintaş' },
  // Grup 5: Eminçelik ailesi
  { brands: ['Eminçelik', 'Elleti'], master: 'Eminçelik' },
  // Grup 6: Minisan ailesi
  { brands: ['Minisan', 'Sunday', 'Maximus'], master: 'Minisan' },
  // Grup 7: İtimat ailesi
  { brands: ['İtimat', 'Woox'], master: 'İtimat' }
];

// Marka için master marka ismini bul (gruplardan birindeyse master'ını döndür)
function getMasterBrand(marka: string): string {
  const normalizedMarka = normalizeTurkish(marka);
  
  // Hangi grupta olduğunu kontrol et
  for (const group of BRAND_GROUPS) {
    const isInGroup = group.brands.some(b => normalizeTurkish(b) === normalizedMarka);
    if (isInGroup) {
      return group.master;
    }
  }
  
  // Hiçbir grupta değilse kendi adını kullan (orijinal formatıyla)
  return marka;
}

// Marka için yazıcı ayarlarını getir
router.get('/:marka', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { marka } = req.params;
    const masterBrand = getMasterBrand(marka);
    console.log('📥 Yazıcı ayarları isteniyor:', marka, '→ Master:', masterBrand);
    
    const result = await pool.query(
      'SELECT config FROM printer_settings WHERE marka = $1',
      [masterBrand]
    );

    if (result.rows.length > 0) {
      console.log('✅ Bulundu: Yazıcı ayarları yüklendi (' + (Array.isArray(result.rows[0].config) ? result.rows[0].config.length + ' alan' : 'config mevcut') + ')');
      res.json(result.rows[0].config);
    } else {
      console.log('⚠️ Bulunamadı');
      res.json(null);
    }
  } catch (error) {
    console.error('❌ Yazıcı ayarları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Marka için yazıcı ayarlarını kaydet/güncelle
router.post('/:marka', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { marka } = req.params;
    const masterBrand = getMasterBrand(marka);
    const config = req.body;

    console.log('📝 Yazıcı ayarları kaydediliyor:', marka, '→ Master:', masterBrand);

    const result = await pool.query(
      `INSERT INTO printer_settings (marka, config, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (marka) 
       DO UPDATE SET config = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [masterBrand, JSON.stringify(config)]
    );

    console.log('✅ Kaydedildi (master brand):', masterBrand);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Yazıcı ayarları kaydetme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Marka için yazıcı ayarlarını sil
router.delete('/:marka', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { marka } = req.params;
    const masterBrand = getMasterBrand(marka);
    await pool.query('DELETE FROM printer_settings WHERE marka = $1', [masterBrand]);
    res.json({ message: 'Yazıcı ayarları silindi' });
  } catch (error) {
    console.error('Yazıcı ayarları silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
