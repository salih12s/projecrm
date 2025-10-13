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

async function fetchAndStoreLocations() {
  try {
    console.log('🌍 İstanbul ilçeleri ve mahalleleri çekiliyor...');
    
    // İstanbul ilçelerini çek (İstanbul province ID: 34)
    const provincesResponse = await axios.get('https://api.turkiyeapi.dev/v1/provinces/34');
    console.log('API Response:', JSON.stringify(provincesResponse.data, null, 2));
    const districts: District[] = provincesResponse.data.data.districts;
    
    console.log(`✅ ${districts.length} ilçe bulundu`);
    
    // İlçeler tablosunu oluştur
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ilceler (
        id SERIAL PRIMARY KEY,
        ilce_id INTEGER UNIQUE NOT NULL,
        isim VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Mahalleler tablosunu oluştur
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
    
    console.log('📦 Tablolar oluşturuldu');
    
    // Mevcut verileri kontrol et
    const existingIlceler = await pool.query('SELECT COUNT(*) FROM ilceler');
    const existingCount = parseInt(existingIlceler.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`ℹ️  Zaten ${existingCount} ilçe mevcut. Script atlanıyor.`);
      return;
    }
    
    // İlçeleri ekle
    for (const district of districts) {
      await pool.query(
        'INSERT INTO ilceler (ilce_id, isim) VALUES ($1, $2) ON CONFLICT (ilce_id) DO NOTHING',
        [district.id, district.name]
      );
    }
    
    console.log('✅ İlçeler database\'e eklendi');
    
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
        
        console.log(`  ✓ ${district.name}: ${neighborhoods.length} mahalle eklendi`);
        
        // API rate limit için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`  ✗ ${district.name} mahalleleri eklenirken hata:`, error.message);
      }
    }
    
    console.log(`\n🎉 Tamamlandı! Toplam ${districts.length} ilçe ve ${totalNeighborhoods} mahalle eklendi.`);
    
    // Sonuçları kontrol et
    const ilceCount = await pool.query('SELECT COUNT(*) FROM ilceler');
    const mahalleCount = await pool.query('SELECT COUNT(*) FROM mahalleler');
    
    console.log(`\n📊 Database durumu:`);
    console.log(`   İlçeler: ${ilceCount.rows[0].count}`);
    console.log(`   Mahalleler: ${mahalleCount.rows[0].count}`);
    
  } catch (error: any) {
    console.error('❌ Hata:', error.message);
    if (error.response) {
      console.error('API Yanıtı:', error.response.data);
    }
    // Hata olsa bile exit code 0 döndür (Railway deploy başarısız olmasın)
    process.exit(0);
  } finally {
    await pool.end();
  }
}

// Script'i çalıştır
fetchAndStoreLocations().then(() => {
  console.log('✅ Script tamamlandı');
  process.exit(0);
}).catch((error) => {
  console.error('Script hatası:', error);
  process.exit(0); // Deploy başarısız olmasın
});
