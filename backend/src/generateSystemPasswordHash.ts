import bcrypt from 'bcryptjs';

const generateHash = async () => {
  const password = 'TakipSistemi!123';
  const hash = await bcrypt.hash(password, 10);
  
  console.log('\n=== SİSTEM ŞİFRESİ HASH ===\n');
  console.log('Şifre:', password);
  console.log('Hash:', hash);
  console.log('\nBu hash değerini .env dosyasına ekleyin:');
  console.log(`SYSTEM_PASSWORD_HASH="${hash}"`);
  console.log('\n');
  
  process.exit(0);
};

generateHash();
