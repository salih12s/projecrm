import { Router } from 'express';
import pool from '../db';

const router = Router();

// Tüm ilçeleri getir
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ilceler ORDER BY isim ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('İlçeler getirilirken hata:', error);
    res.status(500).json({ message: 'İlçeler getirilirken hata oluştu' });
  }
});

// Belirli bir ilçeye ait mahalleleri getir
router.get('/:ilceId/mahalleler', async (req, res) => {
  try {
    const { ilceId } = req.params;
    const result = await pool.query(
      'SELECT * FROM mahalleler WHERE ilce_id = $1 ORDER BY isim ASC',
      [ilceId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Mahalleler getirilirken hata:', error);
    res.status(500).json({ message: 'Mahalleler getirilirken hata oluştu' });
  }
});

export default router;
