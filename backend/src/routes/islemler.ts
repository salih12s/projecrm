import express, { Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';
import { IslemCreateDto } from '../types';

const router = express.Router();

// Tüm işlemleri getir (filtreleme ile)
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      ad_soyad,
      ilce,
      mahalle,
      cadde,
      sokak,
      kapi_no,
      apartman_site,
      blok_no,
      daire_no,
      sabit_tel,
      cep_tel,
      urun,
      marka,
      sikayet,
      teknisyen_ismi,
      is_durumu
    } = req.query;

    let query = 'SELECT * FROM islemler WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (ad_soyad) {
      query += ` AND ad_soyad ILIKE $${paramIndex}`;
      params.push(`%${ad_soyad}%`);
      paramIndex++;
    }

    if (ilce) {
      query += ` AND ilce ILIKE $${paramIndex}`;
      params.push(`%${ilce}%`);
      paramIndex++;
    }

    if (mahalle) {
      query += ` AND mahalle ILIKE $${paramIndex}`;
      params.push(`%${mahalle}%`);
      paramIndex++;
    }

    if (cadde) {
      query += ` AND cadde ILIKE $${paramIndex}`;
      params.push(`%${cadde}%`);
      paramIndex++;
    }

    if (sokak) {
      query += ` AND sokak ILIKE $${paramIndex}`;
      params.push(`%${sokak}%`);
      paramIndex++;
    }

    if (kapi_no) {
      query += ` AND kapi_no ILIKE $${paramIndex}`;
      params.push(`%${kapi_no}%`);
      paramIndex++;
    }

    if (apartman_site) {
      query += ` AND apartman_site ILIKE $${paramIndex}`;
      params.push(`%${apartman_site}%`);
      paramIndex++;
    }

    if (blok_no) {
      query += ` AND blok_no ILIKE $${paramIndex}`;
      params.push(`%${blok_no}%`);
      paramIndex++;
    }

    if (daire_no) {
      query += ` AND daire_no ILIKE $${paramIndex}`;
      params.push(`%${daire_no}%`);
      paramIndex++;
    }

    if (sabit_tel) {
      query += ` AND sabit_tel ILIKE $${paramIndex}`;
      params.push(`%${sabit_tel}%`);
      paramIndex++;
    }

    if (cep_tel) {
      query += ` AND cep_tel ILIKE $${paramIndex}`;
      params.push(`%${cep_tel}%`);
      paramIndex++;
    }

    if (urun) {
      query += ` AND urun ILIKE $${paramIndex}`;
      params.push(`%${urun}%`);
      paramIndex++;
    }

    if (marka) {
      query += ` AND marka ILIKE $${paramIndex}`;
      params.push(`%${marka}%`);
      paramIndex++;
    }

    if (sikayet) {
      query += ` AND sikayet ILIKE $${paramIndex}`;
      params.push(`%${sikayet}%`);
      paramIndex++;
    }

    if (teknisyen_ismi) {
      query += ` AND teknisyen_ismi ILIKE $${paramIndex}`;
      params.push(`%${teknisyen_ismi}%`);
      paramIndex++;
    }

    if (is_durumu) {
      query += ` AND is_durumu = $${paramIndex}`;
      params.push(is_durumu);
      paramIndex++;
    }

    query += ' ORDER BY full_tarih DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('İşlemleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni işlem ekle
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      ad_soyad,
      ilce,
      mahalle,
      cadde,
      sokak,
      kapi_no,
      apartman_site,
      blok_no,
      daire_no,
      sabit_tel,
      cep_tel,
      yedek_tel,
      urun,
      marka,
      sikayet,
      teknisyen_ismi,
      yapilan_islem,
      tutar,
      is_durumu
    }: IslemCreateDto = req.body;

    const result = await pool.query(
      `INSERT INTO islemler (
        ad_soyad, ilce, mahalle, cadde, sokak, kapi_no,
        apartman_site, blok_no, daire_no, sabit_tel, cep_tel, yedek_tel,
        urun, marka, sikayet, teknisyen_ismi, yapilan_islem, tutar, is_durumu, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        ad_soyad, ilce, mahalle, cadde, sokak, kapi_no,
        apartman_site, blok_no, daire_no, sabit_tel, cep_tel, yedek_tel,
        urun, marka, sikayet, teknisyen_ismi, yapilan_islem, tutar, is_durumu || 'acik', req.user?.username
      ]
    );

    // Socket.IO ile tüm kullanıcılara bildir
    const io = req.app.get('io');
    io.emit('yeni-islem', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('İşlem ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İşlem güncelle
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates: any = req.body;

    // Önce mevcut işlemi al
    const existing = await pool.query(
      'SELECT * FROM islemler WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'İşlem bulunamadı' });
      return;
    }

    // Sadece gönderilen alanları güncelle
    const currentData = existing.rows[0];
    const updatedData = { ...currentData, ...updates };

    const result = await pool.query(
      `UPDATE islemler SET
        teknisyen_ismi = $1,
        yapilan_islem = $2,
        tutar = $3,
        ad_soyad = $4,
        ilce = $5,
        mahalle = $6,
        cadde = $7,
        sokak = $8,
        kapi_no = $9,
        apartman_site = $10,
        blok_no = $11,
        daire_no = $12,
        sabit_tel = $13,
        cep_tel = $14,
        yedek_tel = $15,
        urun = $16,
        marka = $17,
        sikayet = $18,
        is_durumu = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $20
      RETURNING *`,
      [
        updatedData.teknisyen_ismi, updatedData.yapilan_islem, updatedData.tutar, 
        updatedData.ad_soyad, updatedData.ilce, updatedData.mahalle,
        updatedData.cadde, updatedData.sokak, updatedData.kapi_no, 
        updatedData.apartman_site, updatedData.blok_no, updatedData.daire_no,
        updatedData.sabit_tel, updatedData.cep_tel, updatedData.yedek_tel, updatedData.urun, 
        updatedData.marka, updatedData.sikayet, updatedData.is_durumu, id
      ]
    );

    // Socket.IO ile tüm kullanıcılara bildir
    const io = req.app.get('io');
    io.emit('islem-guncellendi', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('İşlem güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İşlem sil
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM islemler WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'İşlem bulunamadı' });
      return;
    }

    // Socket.IO ile tüm kullanıcılara bildir
    const io = req.app.get('io');
    io.emit('islem-silindi', id);

    res.json({ message: 'İşlem silindi', islem: result.rows[0] });
  } catch (error) {
    console.error('İşlem silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İşi tamamla/aç
router.patch('/:id/durum', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { is_durumu } = req.body;

    const result = await pool.query(
      `UPDATE islemler SET 
        is_durumu = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`,
      [is_durumu, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'İşlem bulunamadı' });
      return;
    }

    // Socket.IO ile tüm kullanıcılara bildir
    const io = req.app.get('io');
    io.emit('islem-durum-degisti', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('İş durumu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
