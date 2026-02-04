import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Saha Elemanı Girişi
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Saha elemanını bul
    const sahaElemani = await pool.query(
      'SELECT * FROM saha_elemanlari WHERE username = $1',
      [username]
    );

    if (sahaElemani.rows.length === 0) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    const user = sahaElemani.rows[0];

    // Aktiflik kontrolü
    if (!user.is_active) {
      res.status(401).json({ message: 'Hesabınız pasif durumdadır' });
      return;
    }

    // Şifreyi kontrol et
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    // Token oluştur
    const token = jwt.sign(
      { id: user.id, username: user.username, role: 'saha' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Saha girişi başarılı',
      token,
      user: {
        id: user.id,
        username: user.username,
        ad_soyad: user.ad_soyad,
        role: 'saha'
      }
    });
  } catch (error) {
    console.error('Saha giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Saha Elemanı Oluştur (Sadece Admin)
router.post('/create', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, ad_soyad } = req.body;

    // Kullanıcı var mı kontrol et
    const userCheck = await pool.query(
      'SELECT * FROM saha_elemanlari WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length > 0) {
      res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      return;
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Saha elemanını kaydet
    const newUser = await pool.query(
      'INSERT INTO saha_elemanlari (username, password, ad_soyad, created_at, is_active) VALUES ($1, $2, $3, NOW(), TRUE) RETURNING id, username, ad_soyad, created_at, is_active',
      [username, hashedPassword, ad_soyad || null]
    );

    res.status(201).json({
      message: 'Saha elemanı başarıyla oluşturuldu',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Saha elemanı oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm Saha Elemanlarını Listele (Admin)
router.get('/users', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await pool.query(
      `SELECT 
        se.id, 
        se.username, 
        se.ad_soyad,
        se.created_at,
        se.is_active,
        COUNT(sk.id) as total_records
      FROM saha_elemanlari se
      LEFT JOIN saha_kayitlari sk ON sk.saha_elemani_id = se.id
      GROUP BY se.id, se.username, se.ad_soyad, se.created_at, se.is_active
      ORDER BY se.created_at DESC`
    );

    res.json(users.rows);
  } catch (error) {
    console.error('Saha elemanları listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Saha Elemanını Aktif/Pasif Yap
router.patch('/users/:id/toggle', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE saha_elemanlari SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, username, is_active',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Saha elemanı bulunamadı' });
      return;
    }

    res.json({ 
      message: result.rows[0].is_active ? 'Saha elemanı aktif edildi' : 'Saha elemanı pasif edildi',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Saha elemanı durumu değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Saha Elemanını Sil
router.delete('/users/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM saha_elemanlari WHERE id = $1', [id]);

    res.json({ message: 'Saha elemanı başarıyla silindi' });
  } catch (error) {
    console.error('Saha elemanı silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Kayıt Ekle (Saha Elemanı)
router.post('/kayit', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { isim, soyisim, foto_data, notlar } = req.body;
    const user = (req as any).user;

    if (!isim || !soyisim) {
      res.status(400).json({ message: 'İsim ve soyisim zorunludur' });
      return;
    }

    const newRecord = await pool.query(
      `INSERT INTO saha_kayitlari 
        (saha_elemani_id, saha_elemani_username, isim, soyisim, foto_data, notlar, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
      RETURNING *`,
      [user.id, user.username, isim, soyisim, foto_data || null, notlar || null]
    );

    res.status(201).json({
      message: 'Kayıt başarıyla eklendi',
      kayit: newRecord.rows[0]
    });
  } catch (error) {
    console.error('Kayıt ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kendi Kayıtlarını Getir (Saha Elemanı)
router.get('/kayitlar', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { search, startDate, endDate } = req.query;

    let query = `
      SELECT * FROM saha_kayitlari 
      WHERE saha_elemani_id = $1
    `;
    const params: any[] = [user.id];
    let paramIndex = 2;

    // Arama filtresi - isim, soyisim, telefon, adres alanlarında ara (case-insensitive)
    if (search) {
      query += ` AND (
        isim ILIKE $${paramIndex} OR 
        soyisim ILIKE $${paramIndex} OR 
        telefon ILIKE $${paramIndex} OR 
        adres ILIKE $${paramIndex} OR
        CONCAT(isim, ' ', soyisim) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Tarih filtreleri
    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const records = await pool.query(query, params);

    res.json(records.rows);
  } catch (error) {
    console.error('Kayıtları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tek Kayıt Getir
router.get('/kayit/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const record = await pool.query(
      'SELECT * FROM saha_kayitlari WHERE id = $1 AND saha_elemani_id = $2',
      [id, user.id]
    );

    if (record.rows.length === 0) {
      res.status(404).json({ message: 'Kayıt bulunamadı' });
      return;
    }

    res.json(record.rows[0]);
  } catch (error) {
    console.error('Kayıt getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kayıt Güncelle
router.put('/kayit/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isim, soyisim, foto_data, notlar } = req.body;
    const user = (req as any).user;

    const result = await pool.query(
      `UPDATE saha_kayitlari 
       SET isim = $1, soyisim = $2, foto_data = $3, notlar = $4, updated_at = NOW()
       WHERE id = $5 AND saha_elemani_id = $6
       RETURNING *`,
      [isim, soyisim, foto_data, notlar, id, user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Kayıt bulunamadı' });
      return;
    }

    res.json({
      message: 'Kayıt başarıyla güncellendi',
      kayit: result.rows[0]
    });
  } catch (error) {
    console.error('Kayıt güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kayıt Sil
router.delete('/kayit/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    await pool.query(
      'DELETE FROM saha_kayitlari WHERE id = $1 AND saha_elemani_id = $2',
      [id, user.id]
    );

    res.json({ message: 'Kayıt başarıyla silindi' });
  } catch (error) {
    console.error('Kayıt silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm Saha Kayıtlarını Getir (Admin için)
router.get('/all-kayitlar', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, startDate, endDate, sahaElemaniId } = req.query;

    let query = `
      SELECT sk.*, se.ad_soyad as saha_elemani_ad_soyad 
      FROM saha_kayitlari sk
      LEFT JOIN saha_elemanlari se ON sk.saha_elemani_id = se.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // Saha elemanı filtresi
    if (sahaElemaniId) {
      query += ` AND sk.saha_elemani_id = $${paramIndex}`;
      params.push(sahaElemaniId);
      paramIndex++;
    }

    // Arama filtresi - isim, soyisim, telefon, adres alanlarında ara (case-insensitive)
    if (search) {
      query += ` AND (
        sk.isim ILIKE $${paramIndex} OR 
        sk.soyisim ILIKE $${paramIndex} OR 
        sk.telefon ILIKE $${paramIndex} OR 
        sk.adres ILIKE $${paramIndex} OR
        CONCAT(sk.isim, ' ', sk.soyisim) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Tarih filtreleri
    if (startDate) {
      query += ` AND sk.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND sk.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' ORDER BY sk.created_at DESC';

    const records = await pool.query(query, params);

    res.json(records.rows);
  } catch (error) {
    console.error('Tüm saha kayıtlarını getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Saha Elemanının Kayıtlarını Getir (Admin için)
router.get('/user-kayitlar/:username', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const records = await pool.query(
      `SELECT * FROM saha_kayitlari 
       WHERE saha_elemani_username = $1 
       ORDER BY created_at DESC`,
      [username]
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Kullanıcı saha kayıtları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
