import axios from 'axios';
import pool from './db';

interface District {
  id: number;
  name: string;
  population: number;
  area: number;
}

interface Neighborhood {
  id: number;
  name: string;
  population: number;
  districtId: number;
  district: string;
}

export async function initLocations() {
  try {
    // Tabloları oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ilceler (
        id SERIAL PRIMARY KEY,
        ilce_id INTEGER UNIQUE NOT NULL,
        isim VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mahalleler (
        id SERIAL PRIMARY KEY,
        mahalle_id INTEGER UNIQUE NOT NULL,
        ilce_id INTEGER NOT NULL,
        isim VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_mahalleler_ilce_id ON mahalleler(ilce_id)`);
    
    console.log('✅ Location tabloları oluşturuldu');
    
    // Mevcut verileri kontrol et
    const existingIlceler = await pool.query('SELECT COUNT(*) FROM ilceler');
    const existingCount = parseInt(existingIlceler.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`ℹ️  Zaten ${existingCount} ilçe mevcut. Location initialization atlanıyor.`);
      return;
    }
    
    console.log('🌍 İstanbul ilçeleri ve mahalleleri yükleniyor...');
    
    // İstanbul ilçelerini çek
    const provincesResponse = await axios.get('https://api.turkiyeapi.dev/v1/provinces/34');
    const districts: District[] = provincesResponse.data.data.districts;
    
    console.log(`📥 ${districts.length} ilçe bulundu`);
    
    // İlçeleri ekle
    for (const district of districts) {
      await pool.query(
        'INSERT INTO ilceler (ilce_id, isim) VALUES ($1, $2) ON CONFLICT (ilce_id) DO NOTHING',
        [district.id, district.name]
      );
    }
    
    console.log('✅ İlçeler eklendi');
    
    // Her ilçenin mahallelerini çek
    let totalNeighborhoods = 0;
    for (const district of districts) {
      try {
        const neighborhoodsResponse = await axios.get(
          `https://api.turkiyeapi.dev/v1/neighborhoods?districtId=${district.id}&limit=1000`
        );
        
        const neighborhoods: Neighborhood[] = neighborhoodsResponse.data.data;
        
        for (const neighborhood of neighborhoods) {
          await pool.query(
            'INSERT INTO mahalleler (mahalle_id, ilce_id, isim) VALUES ($1, $2, $3) ON CONFLICT (mahalle_id) DO NOTHING',
            [neighborhood.id, district.id, neighborhood.name]
          );
          totalNeighborhoods++;
        }
        
        console.log(`  ✓ ${district.name}: ${neighborhoods.length} mahalle`);
        
        // API rate limit için bekleme
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`  ✗ ${district.name} hata:`, error.message);
      }
    }
    
    console.log(`\n🎉 Location data yüklendi! ${districts.length} ilçe, ${totalNeighborhoods} mahalle`);
    
  } catch (error: any) {
    console.error('❌ Location initialization hatası:', error.message);
    // Hata olsa bile uygulama başlamasın engelleme
  }
}
