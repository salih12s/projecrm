import crypto from 'crypto';
import pool, { query } from '../db';
import { headPhoto, putPhoto } from '../services/r2.service';

type LegacyPhoto = string | { data?: string; name?: string };

function parsePhotos(raw: string | null): LegacyPhoto[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as LegacyPhoto[] : [];
  } catch {
    return [];
  }
}

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

async function migrate(): Promise<void> {
  const batchSize = Math.min(100, Math.max(1, Number(process.env.R2_MIGRATION_BATCH_SIZE || 20)));
  const limit = Number(process.env.R2_MIGRATION_LIMIT || 0);
  let lastId = 0;
  let scanned = 0;
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (;;) {
    const result = await query<{
      id: number;
      foto_data: string | null;
    }>(
      `SELECT id, foto_data
       FROM saha_kayitlari
       WHERE id > $1 AND foto_data IS NOT NULL
       ORDER BY id
       LIMIT $2`,
      [lastId, batchSize]
    );
    if (result.rows.length === 0) break;

    for (const record of result.rows) {
      lastId = record.id;
      scanned += 1;
      const photos = parsePhotos(record.foto_data);

      for (let index = 0; index < Math.min(photos.length, 5); index += 1) {
        const photo = photos[index];
        const dataUrl = typeof photo === 'string' ? photo : photo.data;
        if (!dataUrl) {
          skipped += 1;
          continue;
        }

        const decoded = decodeDataUrl(dataUrl);
        if (!decoded || decoded.body.length === 0) {
          failed += 1;
          console.error(`Geçersiz fotoğraf: kayit=${record.id}, sıra=${index}`);
          continue;
        }

        const checksum = crypto.createHash('sha256').update(decoded.body).digest('hex');
        const objectKey = `legacy/saha/${record.id}/${index}-${checksum.slice(0, 16)}.${decoded.extension}`;

        try {
          try {
            await headPhoto(objectKey);
          } catch {
            await putPhoto(objectKey, decoded.body, decoded.contentType);
          }

          const head = await headPhoto(objectKey);
          if (head.sizeBytes !== decoded.body.length) {
            throw new Error(`boyut doğrulaması başarısız: ${head.sizeBytes} != ${decoded.body.length}`);
          }

          const name = typeof photo === 'object' && typeof photo.name === 'string' ? photo.name : null;
          await query(
            `INSERT INTO saha_fotograflari
              (saha_kaydi_id, object_key, original_name, mime_type, size_bytes,
               checksum_sha256, sort_order, source, migrated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'legacy', NOW())
             ON CONFLICT (object_key) DO NOTHING`,
            [record.id, objectKey, name, decoded.contentType, decoded.body.length, checksum, index]
          );
          uploaded += 1;
        } catch (error) {
          failed += 1;
          console.error(`Taşıma hatası: kayit=${record.id}, sıra=${index}`, error);
        }
      }

      if (limit > 0 && scanned >= limit) break;
    }

    console.log(`R2 migration ilerleme: ${scanned} kayıt, ${uploaded} fotoğraf, ${failed} hata`);
    if (limit > 0 && scanned >= limit) break;
  }

  console.log(`R2 migration tamamlandı: ${scanned} kayıt, ${uploaded} fotoğraf, ${skipped} atlandı, ${failed} hata`);
}

if (require.main === module) {
  migrate()
    .catch((error) => {
      console.error('R2 migration durdu:', error);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}

export default migrate;


