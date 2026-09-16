import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { createPhotoReadUrl, headPhoto, isR2Configured, putPhoto } from '../services/r2.service';
import { query } from '../db';
import authenticateToken from '../middleware/auth';

const router = express.Router();

function decodeDataUrl(dataUrl: string): { body: Buffer; contentType: string; extension: string } | null {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const contentType = match[1].toLowerCase();
  const body = match[2]
    ? Buffer.from(match[3], 'base64')
    : Buffer.from(decodeURIComponent(match[3]), 'utf8');
  const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
  return { body, contentType, extension };
}

async function canAccessRecord(recordId: number, userId: number, role?: string): Promise<boolean> {
  if (role === 'admin') return true;
  const result = await query<{ saha_elemani_id: number }>(
    'SELECT saha_elemani_id FROM saha_kayitlari WHERE id = $1',
    [recordId]
  );
  return result.rows.length > 0 && result.rows[0].saha_elemani_id === userId;
}

router.get('/status', authenticateToken, (_req: Request, res: Response): void => {
  res.json({ configured: isR2Configured(), bucket: process.env.R2_BUCKET || null });
});

// Pilot endpoint: mevcut bir kaydın tek fotoğrafını R2'ye kopyalar.
// Toplu migration bu endpoint'i kullanmaz; migrateSahaPhotosToR2 script'i kullanılır.
router.post('/pilot-upload', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = Number(req.body?.saha_kaydi_id);
    const dataUrl = typeof req.body?.data_url === 'string' ? req.body.data_url : '';
    const originalName = typeof req.body?.original_name === 'string' ? req.body.original_name : null;
    const sortOrder = Number(req.body?.sort_order ?? 0);

    if (!Number.isInteger(recordId) || recordId <= 0 || !dataUrl || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 4) {
      res.status(400).json({ message: 'saha_kaydi_id, data_url ve 0-4 arası sort_order gerekli' });
      return;
    }
    if (!isR2Configured()) {
      res.status(503).json({ message: 'R2 değişkenleri henüz yapılandırılmadı' });
      return;
    }
    if (!(await canAccessRecord(recordId, req.user!.id, req.user!.role))) {
      res.status(403).json({ message: 'Bu kaydın fotoğrafına erişim yetkiniz yok' });
      return;
    }

    const decoded = decodeDataUrl(dataUrl);
    if (!decoded || decoded.body.length === 0 || decoded.body.length > 15 * 1024 * 1024) {
      res.status(400).json({ message: 'Geçersiz veya 15 MB sınırını aşan fotoğraf' });
      return;
    }

    const checksum = crypto.createHash('sha256').update(decoded.body).digest('hex');
    const objectKey = `saha/${recordId}/${sortOrder}-${checksum.slice(0, 16)}.${decoded.extension}`;
    await putPhoto(objectKey, decoded.body, decoded.contentType);
    const head = await headPhoto(objectKey);
    if (head.sizeBytes !== decoded.body.length) {
      res.status(502).json({ message: 'R2 boyut doğrulaması başarısız' });
      return;
    }

    await query(
      `INSERT INTO saha_fotograflari
        (saha_kaydi_id, object_key, original_name, mime_type, size_bytes,
         checksum_sha256, sort_order, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'r2')
       ON CONFLICT (saha_kaydi_id, sort_order)
       DO UPDATE SET object_key = EXCLUDED.object_key,
                     original_name = EXCLUDED.original_name,
                     mime_type = EXCLUDED.mime_type,
                     size_bytes = EXCLUDED.size_bytes,
                     checksum_sha256 = EXCLUDED.checksum_sha256`,
      [recordId, objectKey, originalName, decoded.contentType, decoded.body.length, checksum, sortOrder]
    );

    res.status(201).json({ object_key: objectKey, url: await createPhotoReadUrl(objectKey) });
  } catch (error) {
    console.error('R2 pilot upload hatası:', error);
    res.status(500).json({ message: "Fotoğraf R2'ye yüklenemedi" });
  }
});

router.get('/photos/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = Number(req.params.id);
    if (!Number.isInteger(recordId) || !(await canAccessRecord(recordId, req.user!.id, req.user!.role))) {
      res.status(404).json({ message: 'Kayıt bulunamadı' });
      return;
    }
    const result = await query<{
      object_key: string;
      original_name: string | null;
      mime_type: string;
      size_bytes: number;
      sort_order: number;
    }>(
      `SELECT object_key, original_name, mime_type, size_bytes, sort_order
       FROM saha_fotograflari WHERE saha_kaydi_id = $1 ORDER BY sort_order`,
      [recordId]
    );
    const photos = await Promise.all(result.rows.map(async photo => ({
      ...photo,
      url: await createPhotoReadUrl(photo.object_key),
    })));
    res.json({ photos });
  } catch (error) {
    console.error('R2 fotoğraf listeleme hatası:', error);
    res.status(500).json({ message: 'Fotoğraflar okunamadı' });
  }
});

export default router;

