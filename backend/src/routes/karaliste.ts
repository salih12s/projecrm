import express, { Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Tablo oluştur (uygulama başlatılırken çağrılacak)
export const createKaralisteTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS karaliste (
      id SERIAL PRIMARY KEY,
      ad_soyad VARCHAR(100) NOT NULL,
      cep_tel VARCHAR(20),
      yedek_tel VARCHAR(20),
      mahalle VARCHAR(100),
      cadde VARCHAR(100),
      sokak VARCHAR(100),
      kapi_no VARCHAR(20),
      sebep TEXT,
      created_by VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Karalisteye ekle
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { ad_soyad, cep_tel, yedek_tel, mahalle, cadde, sokak, kapi_no, sebep } = req.body;
    const created_by = (req as any).user?.username || 'system';

    if (!ad_soyad) {
      res.status(400).json({ message: 'Ad soyad zorunludur' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO karaliste (ad_soyad, cep_tel, yedek_tel, mahalle, cadde, sokak, kapi_no, sebep, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [ad_soyad, cep_tel || null, yedek_tel || null, mahalle || null, cadde || null, sokak || null, kapi_no || null, sebep || null, created_by]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Karalisteye ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Karalisteden sil
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM karaliste WHERE id = $1', [id]);
    res.json({ message: 'Karalisteden silindi' });
  } catch (error) {
    console.error('Karalisteden silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Telefon numarasına göre karaliste kontrolü
router.get('/check-phone', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;
    if (!phone) {
      res.json({ blacklisted: false });
      return;
    }
    const cleanedPhone = (phone as string).replace(/\D/g, '');

    const result = await pool.query(
      `SELECT * FROM karaliste WHERE 
        REPLACE(REPLACE(REPLACE(REPLACE(cep_tel, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $1
        OR REPLACE(REPLACE(REPLACE(REPLACE(yedek_tel, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $1
      ORDER BY created_at DESC LIMIT 1`,
      [`%${cleanedPhone}%`]
    );

    if (result.rows.length > 0) {
      res.json({ blacklisted: true, record: result.rows[0] });
    } else {
      res.json({ blacklisted: false });
    }
  } catch (error) {
    console.error('Karaliste kontrol hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Adrese göre karaliste kontrolü (mahalle + cadde/sokak + kapı_no)
router.get('/check-address', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { mahalle, cadde, sokak, kapi_no } = req.query;

    if (!mahalle && !sokak && !cadde) {
      res.json({ blacklisted: false });
      return;
    }

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (mahalle) {
      whereClause += ` AND LOWER(mahalle) = LOWER($${paramIndex})`;
      params.push(mahalle);
      paramIndex++;
    }
    if (cadde) {
      whereClause += ` AND LOWER(cadde) = LOWER($${paramIndex})`;
      params.push(cadde);
      paramIndex++;
    }
    if (sokak) {
      whereClause += ` AND LOWER(sokak) = LOWER($${paramIndex})`;
      params.push(sokak);
      paramIndex++;
    }
    if (kapi_no) {
      whereClause += ` AND LOWER(kapi_no) = LOWER($${paramIndex})`;
      params.push(kapi_no);
      paramIndex++;
    }

    const result = await pool.query(
      `SELECT * FROM karaliste ${whereClause} ORDER BY created_at DESC LIMIT 1`,
      params
    );

    if (result.rows.length > 0) {
      res.json({ blacklisted: true, record: result.rows[0] });
    } else {
      res.json({ blacklisted: false });
    }
  } catch (error) {
    console.error('Karaliste adres kontrol hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm karaliste kayıtlarını listele
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM karaliste ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Karaliste listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
