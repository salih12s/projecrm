import { Router } from 'express';
import pool from '../db';
import { Urun } from '../types';
import authenticateToken from '../middleware/auth';

const router = Router();

// Tüm ürünleri getir
router.get('/', authenticateToken, async (_req, res) => {
  try {
    const result = await pool.query<Urun>(
      'SELECT * FROM urunler ORDER BY isim ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ürünler getirme hatası:', error);
    res.status(500).json({ error: 'Ürünler getirilemedi' });
  }
});

// Yeni ürün ekle
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { isim } = req.body;
    
    if (!isim) {
      return res.status(400).json({ error: 'Ürün ismi gerekli' });
    }

    const result = await pool.query<Urun>(
      'INSERT INTO urunler (isim) VALUES ($1) RETURNING *',
      [isim]
    );
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    return res.status(500).json({ error: 'Ürün eklenemedi' });
  }
});

// Ürün güncelle
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isim } = req.body;

    if (!isim) {
      return res.status(400).json({ error: 'Ürün ismi gerekli' });
    }

    const result = await pool.query<Urun>(
      'UPDATE urunler SET isim = $1 WHERE id = $2 RETURNING *',
      [isim, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    return res.status(500).json({ error: 'Ürün güncellenemedi' });
  }
});

// Ürün sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM urunler WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı' });
    }

    return res.json({ message: 'Ürün silindi' });
  } catch (error) {
    console.error('Ürün silme hatası:', error);
    return res.status(500).json({ error: 'Ürün silinemedi' });
  }
});

export default router;
