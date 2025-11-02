import express, { Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Tüm teknisyenleri getir
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    // ⚡ CACHE: Teknisyen listesi 5 dakika tarayıcıda cache'lenir
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 dakika
      'ETag': `teknisyenler-${Date.now()}`, // Her 5 dakikada yeni ETag
    });
    
    const result = await pool.query(
      'SELECT * FROM teknisyenler ORDER BY isim ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Teknisyen listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni teknisyen ekle
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isim } = req.body;

    if (!isim || !isim.trim()) {
      res.status(400).json({ message: 'Teknisyen ismi gereklidir' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO teknisyenler (isim) VALUES ($1) RETURNING *',
      [isim.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Bu teknisyen zaten kayıtlı' });
    } else {
      console.error('Teknisyen ekleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }
});

// Teknisyen güncelle
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isim } = req.body;

    if (!isim || !isim.trim()) {
      res.status(400).json({ message: 'Teknisyen ismi gereklidir' });
      return;
    }

    const result = await pool.query(
      'UPDATE teknisyenler SET isim = $1 WHERE id = $2 RETURNING *',
      [isim.trim(), id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Teknisyen bulunamadı' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Bu teknisyen ismi zaten kullanılıyor' });
    } else {
      console.error('Teknisyen güncelleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }
});

// Teknisyen sil
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM teknisyenler WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Teknisyen bulunamadı' });
      return;
    }

    res.json({ message: 'Teknisyen başarıyla silindi' });
  } catch (error) {
    console.error('Teknisyen silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
