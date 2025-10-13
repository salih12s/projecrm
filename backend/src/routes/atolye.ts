import express, { Request, Response } from 'express';
import pool from '../db';
import auth from '../middleware/auth';
import { Atolye, AtolyeCreateDto, AtolyeUpdateDto } from '../types';

const router = express.Router();

// GET all atolye records
router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query<Atolye>(
      'SELECT * FROM atolye ORDER BY created_at DESC'
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching atolye records:', error);
    return res.status(500).json({ error: 'Atölye kayıtları getirilirken hata oluştu' });
  }
});

// GET single atolye record
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query<Atolye>(
      'SELECT * FROM atolye WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching atolye record:', error);
    return res.status(500).json({ error: 'Kayıt getirilirken hata oluştu' });
  }
});

// POST new atolye record
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const createDto: AtolyeCreateDto = req.body;
    const username = (req as any).user?.username;

    const result = await pool.query<Atolye>(
      `INSERT INTO atolye (
        bayi_adi, musteri_ad_soyad, tel_no, marka, kod, seri_no, sikayet, ozel_not, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        createDto.bayi_adi || null,
        createDto.musteri_ad_soyad || null,
        createDto.tel_no || null,
        createDto.marka || null,
        createDto.kod || null,
        createDto.seri_no || null,
        createDto.sikayet || null,
        createDto.ozel_not || null,
        username || null
      ]
    );

    const newRecord = result.rows[0];

    // Socket.IO ile tüm bağlı kullanıcılara bildir
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('yeni-atolye', newRecord);
    }

    return res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error creating atolye record:', error);
    return res.status(500).json({ error: 'Kayıt oluşturulurken hata oluştu' });
  }
});

// PUT update atolye record
router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateDto: AtolyeUpdateDto = req.body;

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (updateDto.teslim_durumu !== undefined) {
      updates.push(`teslim_durumu = $${paramCounter++}`);
      values.push(updateDto.teslim_durumu);
    }
    if (updateDto.bayi_adi !== undefined) {
      updates.push(`bayi_adi = $${paramCounter++}`);
      values.push(updateDto.bayi_adi);
    }
    if (updateDto.musteri_ad_soyad !== undefined) {
      updates.push(`musteri_ad_soyad = $${paramCounter++}`);
      values.push(updateDto.musteri_ad_soyad);
    }
    if (updateDto.tel_no !== undefined) {
      updates.push(`tel_no = $${paramCounter++}`);
      values.push(updateDto.tel_no);
    }
    if (updateDto.marka !== undefined) {
      updates.push(`marka = $${paramCounter++}`);
      values.push(updateDto.marka);
    }
    if (updateDto.kod !== undefined) {
      updates.push(`kod = $${paramCounter++}`);
      values.push(updateDto.kod);
    }
    if (updateDto.seri_no !== undefined) {
      updates.push(`seri_no = $${paramCounter++}`);
      values.push(updateDto.seri_no);
    }
    if (updateDto.sikayet !== undefined) {
      updates.push(`sikayet = $${paramCounter++}`);
      values.push(updateDto.sikayet);
    }
    if (updateDto.ozel_not !== undefined) {
      updates.push(`ozel_not = $${paramCounter++}`);
      values.push(updateDto.ozel_not);
    }
    if (updateDto.yapilan_islem !== undefined) {
      updates.push(`yapilan_islem = $${paramCounter++}`);
      values.push(updateDto.yapilan_islem);
    }
    if (updateDto.ucret !== undefined) {
      updates.push(`ucret = $${paramCounter++}`);
      values.push(updateDto.ucret);
    }
    if (updateDto.yapilma_tarihi !== undefined) {
      updates.push(`yapilma_tarihi = $${paramCounter++}`);
      values.push(updateDto.yapilma_tarihi);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE atolye 
      SET ${updates.join(', ')}
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await pool.query<Atolye>(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    const updatedRecord = result.rows[0];

    // Socket.IO ile tüm bağlı kullanıcılara bildir
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('atolye-guncellendi', updatedRecord);
    }

    return res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating atolye record:', error);
    return res.status(500).json({ error: 'Kayıt güncellenirken hata oluştu' });
  }
});

// DELETE atolye record
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM atolye WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    // Socket.IO ile tüm bağlı kullanıcılara bildir
    const io = (req as any).app.get('io');
    if (io) {
      io.emit('atolye-silindi', parseInt(id));
    }

    return res.json({ message: 'Kayıt başarıyla silindi' });
  } catch (error) {
    console.error('Error deleting atolye record:', error);
    return res.status(500).json({ error: 'Kayıt silinirken hata oluştu' });
  }
});

export default router;
