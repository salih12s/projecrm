import express, { Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Tüm markaları getir
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    // ⚡ CACHE: Marka listesi 5 dakika tarayıcıda cache'lenir
    res.set({
      'Cache-Control': 'public, max-age=300',
      'ETag': `markalar-${Date.now()}`,
    });
    
    const result = await pool.query(
      'SELECT * FROM markalar ORDER BY isim ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Marka listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni marka ekle
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isim } = req.body;

    if (!isim || !isim.trim()) {
      res.status(400).json({ message: 'Marka ismi gereklidir' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO markalar (isim) VALUES ($1) RETURNING *',
      [isim.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Bu marka zaten kayıtlı' });
    } else {
      console.error('Marka ekleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }
});

// Marka güncelle
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isim } = req.body;

    if (!isim || !isim.trim()) {
      res.status(400).json({ message: 'Marka ismi gereklidir' });
      return;
    }

    const result = await pool.query(
      'UPDATE markalar SET isim = $1 WHERE id = $2 RETURNING *',
      [isim.trim(), id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Marka bulunamadı' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ message: 'Bu marka ismi zaten kullanılıyor' });
    } else {
      console.error('Marka güncelleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  }
});

// Marka sil
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM markalar WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Marka bulunamadı' });
      return;
    }

    res.json({ message: 'Marka başarıyla silindi' });
  } catch (error) {
    console.error('Marka silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
