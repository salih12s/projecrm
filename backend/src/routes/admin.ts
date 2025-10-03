import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Admin Girişi
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Admin kullanıcısını bul
    const admin = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    );

    if (admin.rows.length === 0) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    // Şifreyi kontrol et
    const validPassword = await bcrypt.compare(password, admin.rows[0].password);

    if (!validPassword) {
      res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı' });
      return;
    }

    // Token oluştur
    const token = jwt.sign(
      { id: admin.rows[0].id, username: admin.rows[0].username, role: 'admin' },
      process.env.JWT_SECRET || '',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Admin girişi başarılı',
      token,
      user: {
        id: admin.rows[0].id,
        username: admin.rows[0].username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı Oluştur (Sadece Admin)
router.post('/create-user', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Kullanıcı var mı kontrol et
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userCheck.rows.length > 0) {
      res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
      return;
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı kaydet
    const newUser = await pool.query(
      'INSERT INTO users (username, password, created_at, is_active) VALUES ($1, $2, NOW(), TRUE) RETURNING id, username, created_at, is_active',
      [username, hashedPassword]
    );

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm Kullanıcıları Listele
router.get('/users', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await pool.query(
      `SELECT 
        u.id, 
        u.username, 
        u.created_at,
        u.is_active,
        COUNT(i.id) as total_records
      FROM users u
      LEFT JOIN islemler i ON i.created_by = u.username
      GROUP BY u.id, u.username, u.created_at, u.is_active
      ORDER BY u.created_at DESC`
    );

    res.json(users.rows);
  } catch (error) {
    console.error('Kullanıcı listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcıyı Aktif/Pasif Yap
router.patch('/users/:id/toggle', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, username, is_active',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }

    res.json({ 
      message: result.rows[0].is_active ? 'Kullanıcı aktif edildi' : 'Kullanıcı pasif edildi',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Kullanıcı durumu değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcıyı Sil
router.delete('/users/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Kullanıcı başarıyla silindi' });
  } catch (error) {
    console.error('Kullanıcı silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının Kayıtlarını Getir (İşlemler)
router.get('/user-records/:username', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const records = await pool.query(
      `SELECT 
        id,
        full_tarih,
        ad_soyad,
        ilce,
        mahalle,
        cep_tel,
        urun,
        marka,
        sikayet,
        is_durumu,
        created_by,
        updated_at
      FROM islemler 
      WHERE created_by = $1 
      ORDER BY full_tarih DESC`,
      [username]
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Kullanıcı kayıtları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcının Atölye Kayıtlarını Getir
router.get('/user-atolye-records/:username', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.params;

    const records = await pool.query(
      `SELECT 
        id,
        teslim_durumu,
        bayi_adi,
        musteri_ad_soyad,
        tel_no,
        marka,
        kod,
        seri_no,
        sikayet,
        ozel_not,
        yapilan_islem,
        ucret,
        yapilma_tarihi,
        created_by,
        created_at,
        updated_at
      FROM atolye 
      WHERE created_by = $1 
      ORDER BY created_at DESC`,
      [username]
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Kullanıcı atölye kayıtları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm İşlemleri Getir (Admin için - tamamlananlar dahil düzenlenebilir)
router.get('/all-records', authenticateToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const records = await pool.query(
      `SELECT * FROM islemler ORDER BY full_tarih DESC`
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Tüm kayıtları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
