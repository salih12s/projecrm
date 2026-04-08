import express, { Request, Response } from 'express';
import pool from '../db';
import authMiddleware from '../middleware/auth';
import { IslemCreateDto } from '../types';

const router = express.Router();

// İstatistikler endpoint - hafif, sadece sayılar döner
router.get('/stats', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_durumu = 'acik') as acik,
        COUNT(*) FILTER (WHERE is_durumu = 'parca_bekliyor') as parca_bekliyor,
        COUNT(*) FILTER (WHERE is_durumu = 'tamamlandi') as tamamlandi,
        COUNT(*) FILTER (WHERE is_durumu = 'iptal') as iptal,
        COUNT(*) FILTER (WHERE full_tarih >= CURRENT_DATE AND full_tarih < CURRENT_DATE + INTERVAL '1 day') as bugun,
        COUNT(*) FILTER (WHERE (yazdirildi IS NULL OR yazdirildi = false)) as yazdirilmamis
      FROM islemler
    `);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('İstatistik hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

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
      yapilan_islem,
      tutar,
      is_durumu,
      today,
      yazdirilmamis,
      page,
      limit: limitParam
    } = req.query;

    let whereClause = ' WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (ad_soyad) {
      whereClause += ` AND ad_soyad ILIKE $${paramIndex}`;
      params.push(`%${ad_soyad}%`);
      paramIndex++;
    }

    if (ilce) {
      whereClause += ` AND ilce ILIKE $${paramIndex}`;
      params.push(`%${ilce}%`);
      paramIndex++;
    }

    if (mahalle) {
      whereClause += ` AND mahalle ILIKE $${paramIndex}`;
      params.push(`%${mahalle}%`);
      paramIndex++;
    }

    if (cadde) {
      whereClause += ` AND cadde ILIKE $${paramIndex}`;
      params.push(`%${cadde}%`);
      paramIndex++;
    }

    if (sokak) {
      whereClause += ` AND sokak ILIKE $${paramIndex}`;
      params.push(`%${sokak}%`);
      paramIndex++;
    }

    if (kapi_no) {
      whereClause += ` AND kapi_no ILIKE $${paramIndex}`;
      params.push(`%${kapi_no}%`);
      paramIndex++;
    }

    if (apartman_site) {
      whereClause += ` AND apartman_site ILIKE $${paramIndex}`;
      params.push(`%${apartman_site}%`);
      paramIndex++;
    }

    if (blok_no) {
      whereClause += ` AND blok_no ILIKE $${paramIndex}`;
      params.push(`%${blok_no}%`);
      paramIndex++;
    }

    if (daire_no) {
      whereClause += ` AND daire_no ILIKE $${paramIndex}`;
      params.push(`%${daire_no}%`);
      paramIndex++;
    }

    if (sabit_tel) {
      whereClause += ` AND sabit_tel ILIKE $${paramIndex}`;
      params.push(`%${sabit_tel}%`);
      paramIndex++;
    }

    if (cep_tel) {
      whereClause += ` AND (cep_tel ILIKE $${paramIndex} OR yedek_tel ILIKE $${paramIndex + 1})`;
      params.push(`%${cep_tel}%`);
      params.push(`%${cep_tel}%`);
      paramIndex += 2;
    }

    if (urun) {
      whereClause += ` AND urun ILIKE $${paramIndex}`;
      params.push(`%${urun}%`);
      paramIndex++;
    }

    if (marka) {
      whereClause += ` AND marka ILIKE $${paramIndex}`;
      params.push(`%${marka}%`);
      paramIndex++;
    }

    if (sikayet) {
      whereClause += ` AND sikayet ILIKE $${paramIndex}`;
      params.push(`%${sikayet}%`);
      paramIndex++;
    }

    if (teknisyen_ismi) {
      whereClause += ` AND teknisyen_ismi ILIKE $${paramIndex}`;
      params.push(`%${teknisyen_ismi}%`);
      paramIndex++;
    }

    if (yapilan_islem) {
      whereClause += ` AND yapilan_islem ILIKE $${paramIndex}`;
      params.push(`%${yapilan_islem}%`);
      paramIndex++;
    }

    if (tutar) {
      whereClause += ` AND tutar::text ILIKE $${paramIndex}`;
      params.push(`%${tutar}%`);
      paramIndex++;
    }

    if (is_durumu) {
      whereClause += ` AND is_durumu = $${paramIndex}`;
      params.push(is_durumu);
      paramIndex++;
    }

    if (today === 'true') {
      whereClause += ` AND full_tarih >= CURRENT_DATE AND full_tarih < CURRENT_DATE + INTERVAL '1 day'`;
    }

    if (yazdirilmamis === 'true') {
      whereClause += ` AND (yazdirildi IS NULL OR yazdirildi = false)`;
    }

    // Pagination opsiyonel - page/limit gönderilmezse tüm veriyi döndür
    const usePagination = page || limitParam;

    if (usePagination) {
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(limitParam as string) || 100));
      const offset = (pageNum - 1) * limitNum;

      const countResult = await pool.query(`SELECT COUNT(*) as total FROM islemler${whereClause}`, params);
      const total = parseInt(countResult.rows[0].total);

      const dataQuery = `SELECT * FROM islemler${whereClause} ORDER BY full_tarih DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limitNum, offset);
      const result = await pool.query(dataQuery, params);

      res.json({
        data: result.rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } else {
      const result = await pool.query(`SELECT * FROM islemler${whereClause} ORDER BY full_tarih DESC`, params);
      res.json(result.rows);
    }
  } catch (error) {
    console.error('İşlemleri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Telefon numarasına göre kayıt ara (duplicate kontrolü için - hafif endpoint)
router.get('/search-by-phone', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;
    if (!phone) {
      res.json([]);
      return;
    }
    const cleanedPhone = (phone as string).replace(/\D/g, '');
    const result = await pool.query(
      `SELECT * FROM islemler WHERE cep_tel LIKE $1 OR yedek_tel LIKE $1 ORDER BY id DESC LIMIT 50`,
      [`%${cleanedPhone}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Telefon arama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// İsme göre müşteri geçmişi ara (hafif endpoint)
router.get('/search-by-name', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.query;
    if (!name) {
      res.json([]);
      return;
    }
    const result = await pool.query(
      `SELECT * FROM islemler WHERE ad_soyad ILIKE $1 ORDER BY id DESC LIMIT 200`,
      [`%${name}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('İsim arama hatası:', error);
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

    // VARCHAR(20) alanları truncate et
    const truncatedKapiNo = (kapi_no || '').slice(0, 20);
    const truncatedBlokNo = (blok_no || '').slice(0, 20);
    const truncatedDaireNo = (daire_no || '').slice(0, 20);
    const truncatedSabitTel = (sabit_tel || '').replace(/\D/g, '').slice(0, 20);
    const truncatedCepTel = (cep_tel || '').replace(/\D/g, '').slice(0, 20);
    const truncatedYedekTel = (yedek_tel || '').replace(/\D/g, '').slice(0, 20);
    const truncatedIsDurumu = (is_durumu || 'acik').slice(0, 20);

    const result = await pool.query(
      `INSERT INTO islemler (
        ad_soyad, ilce, mahalle, cadde, sokak, kapi_no,
        apartman_site, blok_no, daire_no, sabit_tel, cep_tel, yedek_tel,
        urun, marka, sikayet, teknisyen_ismi, yapilan_islem, tutar, is_durumu, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        ad_soyad, ilce, mahalle, cadde, sokak, truncatedKapiNo,
        apartman_site, truncatedBlokNo, truncatedDaireNo, truncatedSabitTel, truncatedCepTel, truncatedYedekTel,
        urun, marka, sikayet, teknisyen_ismi, yapilan_islem, tutar, truncatedIsDurumu, req.user?.username
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

    // VARCHAR(20) alanları truncate et
    const truncatedKapiNo = (updatedData.kapi_no || '').slice(0, 20);
    const truncatedBlokNo = (updatedData.blok_no || '').slice(0, 20);
    const truncatedDaireNo = (updatedData.daire_no || '').slice(0, 20);
    const truncatedSabitTel = (updatedData.sabit_tel || '').replace(/\D/g, '').slice(0, 20);
    const truncatedCepTel = (updatedData.cep_tel || '').replace(/\D/g, '').slice(0, 20);
    const truncatedYedekTel = (updatedData.yedek_tel || '').replace(/\D/g, '').slice(0, 20);
    const truncatedIsDurumu = (updatedData.is_durumu || 'acik').slice(0, 20);

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
        yazdirildi = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
      RETURNING *`,
      [
        updatedData.teknisyen_ismi, updatedData.yapilan_islem, updatedData.tutar, 
        updatedData.ad_soyad, updatedData.ilce, updatedData.mahalle,
        updatedData.cadde, updatedData.sokak, truncatedKapiNo, 
        updatedData.apartman_site, truncatedBlokNo, truncatedDaireNo,
        truncatedSabitTel, truncatedCepTel, truncatedYedekTel, updatedData.urun, 
        updatedData.marka, updatedData.sikayet, truncatedIsDurumu, 
        updatedData.yazdirildi, id
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
