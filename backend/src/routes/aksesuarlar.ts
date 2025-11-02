import express, { Request, Response } from 'express';
import pool from '../db';
import auth from '../middleware/auth';
import { Aksesuar } from '../types';

const router = express.Router();

// GET all aksesuarlar
router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    // ⚡ CACHE: Aksesuar listesi 5 dakika tarayıcıda cache'lenir
    res.set({
      'Cache-Control': 'public, max-age=300',
      'ETag': `aksesuarlar-${Date.now()}`,
    });
    
    const result = await pool.query<Aksesuar>(
      'SELECT * FROM aksesuarlar ORDER BY isim ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching aksesuarlar:', error);
    res.status(500).json({ error: 'Aksesuarlar getirilirken hata oluştu' });
  }
});

// POST new aksesuar
router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isim } = req.body;

    if (!isim || !isim.trim()) {
      res.status(400).json({ error: 'Aksesuar ismi gereklidir' });
      return;
    }

    const result = await pool.query<Aksesuar>(
      'INSERT INTO aksesuarlar (isim) VALUES ($1) RETURNING *',
      [isim.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating aksesuar:', error);
    
    if (error.code === '23505') {
      res.status(409).json({ error: 'Bu aksesuar zaten mevcut' });
      return;
    }
    
    res.status(500).json({ error: 'Aksesuar oluşturulurken hata oluştu' });
  }
});

// PUT update aksesuar
router.put('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isim } = req.body;

    if (!isim || !isim.trim()) {
      res.status(400).json({ error: 'Aksesuar ismi gereklidir' });
      return;
    }

    const result = await pool.query<Aksesuar>(
      'UPDATE aksesuarlar SET isim = $1 WHERE id = $2 RETURNING *',
      [isim.trim(), id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Aksesuar bulunamadı' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating aksesuar:', error);
    
    if (error.code === '23505') {
      res.status(409).json({ error: 'Bu aksesuar ismi zaten kullanılıyor' });
      return;
    }
    
    res.status(500).json({ error: 'Aksesuar güncellenirken hata oluştu' });
  }
});

// DELETE aksesuar
router.delete('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM aksesuarlar WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Aksesuar bulunamadı' });
      return;
    }

    res.json({ message: 'Aksesuar başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting aksesuar:', error);
    res.status(500).json({ error: 'Aksesuar silinirken hata oluştu' });
  }
});

export default router;
