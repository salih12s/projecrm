import { Router, Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';

const router = Router();

// Marka için yazıcı ayarlarını getir
router.get('/:marka', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { marka } = req.params;
    console.log('📥 Yazıcı ayarları isteniyor:', marka);
    
    const result = await pool.query(
      'SELECT config FROM printer_settings WHERE marka = $1',
      [marka]
    );

    if (result.rows.length > 0) {
      console.log('✅ Bulundu:', result.rows[0].config);
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
    const config = req.body;

    console.log('📝 Yazıcı ayarları kaydediliyor:', { marka, config });

    const result = await pool.query(
      `INSERT INTO printer_settings (marka, config, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (marka) 
       DO UPDATE SET config = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [marka, JSON.stringify(config)]
    );

    console.log('✅ Kaydedildi:', result.rows[0]);
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
    await pool.query('DELETE FROM printer_settings WHERE marka = $1', [marka]);
    res.json({ message: 'Yazıcı ayarları silindi' });
  } catch (error) {
    console.error('Yazıcı ayarları silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
