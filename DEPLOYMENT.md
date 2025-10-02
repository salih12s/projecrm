# Production Deployment Checklist

## 🚀 Production'a Geçiş Adımları

### 1. Environment Variables

#### Backend (.env)
```bash
# MUTLAKA DEĞİŞTİRİN!
NODE_ENV=production
JWT_SECRET=<güçlü-random-string-64-karakter>
SESSION_SECRET=<başka-güçlü-random-string>

# Database (Production DB bilgileri)
DB_HOST=<production-db-host>
DB_PORT=5432
DB_NAME=<production-db-name>
DB_USER=<production-db-user>
DB_PASSWORD=<güçlü-db-password>

# CORS (Production frontend URL)
CORS_ORIGIN=https://your-domain.com
SOCKET_CORS_ORIGIN=https://your-domain.com

PORT=5000
```

#### Frontend (.env.production)
```bash
VITE_API_URL=https://your-api-domain.com/api
VITE_SOCKET_URL=https://your-api-domain.com
```

### 2. Güvenlik Kontrolleri

- [ ] JWT_SECRET değiştirildi ve güçlü
- [ ] Veritabanı şifresi güçlü
- [ ] PostgreSQL remote access ayarlandı
- [ ] Firewall kuralları yapılandırıldı
- [ ] SSL/TLS sertifikası kuruldu
- [ ] HTTPS zorunlu hale getirildi
- [ ] Rate limiting eklendi (opsiyonel)
- [ ] Helmet.js middleware eklendi (backend)

### 3. Database Migration

```bash
# Production veritabanını oluştur
createdb -h <host> -U <user> <database-name>

# Backend'i çalıştır (tablolar otomatik oluşur)
npm start
```

### 4. Build Process

#### Backend Build
```bash
cd backend
npm install --production
npm run build
npm start
```

#### Frontend Build
```bash
cd frontend
npm install
npm run build

# dist/ klasörü oluşur
# Bu klasörü web server'da host edin (Nginx/Apache)
```

### 5. Server Kurulumu

#### PM2 ile Backend Çalıştırma (Önerilen)
```bash
npm install -g pm2

cd backend
pm2 start dist/server.js --name crm-backend
pm2 save
pm2 startup
```

#### Nginx Configuration (Frontend)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # HTTPS'e yönlendir
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /var/www/crm-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Monitoring ve Logging

#### PM2 Monitoring
```bash
pm2 monit
pm2 logs crm-backend
pm2 status
```

#### Loglar
```bash
# PM2 logs
pm2 logs

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### 7. Backup Stratejisi

#### Database Backup
```bash
# Günlük otomatik backup (crontab)
0 2 * * * pg_dump -h <host> -U <user> <database> > /backups/crm_$(date +\%Y\%m\%d).sql

# Manual backup
pg_dump -h <host> -U <user> <database> > backup.sql

# Restore
psql -h <host> -U <user> <database> < backup.sql
```

#### File Backup
```bash
# Uygulama dosyaları
tar -czf crm-backup-$(date +%Y%m%d).tar.gz /var/www/crm-frontend /opt/crm-backend
```

### 8. Performance Optimization

#### Backend
- [ ] Gzip compression enabled
- [ ] Database indexing
- [ ] Connection pooling configured
- [ ] Caching strategy (Redis opsiyonel)

#### Frontend
- [ ] Build optimized (production mode)
- [ ] Assets minified
- [ ] Lazy loading implemented
- [ ] CDN kullanımı (opsiyonel)

### 9. Health Checks

Backend'e health check endpoint ekle:
```typescript
// server.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### 10. SSL/TLS Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d your-domain.com

# Otomatik yenileme
sudo certbot renew --dry-run
```

## 🔒 Güvenlik Hardening

### PostgreSQL
```sql
-- Sadece gerekli izinleri ver
CREATE USER crm_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE crm_db TO crm_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crm_user;
```

### Firewall (UFW)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Fail2Ban (Brute Force Koruması)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📊 Monitoring Tools (Opsiyonel)

- **PM2 Plus:** Process monitoring
- **New Relic:** Application performance
- **Sentry:** Error tracking
- **Google Analytics:** User analytics
- **Uptime Robot:** Uptime monitoring

## ✅ Final Checklist

- [ ] Tüm environment variables production için ayarlandı
- [ ] SSL/TLS sertifikası kuruldu
- [ ] Backend build ve deploy edildi
- [ ] Frontend build ve deploy edildi
- [ ] Database migration tamamlandı
- [ ] Backup stratejisi oluşturuldu
- [ ] Monitoring kuruldu
- [ ] Firewall yapılandırıldı
- [ ] DNS kayıtları güncellendi
- [ ] Test edildi (production environment)
- [ ] Documentation güncellendi

## 🆘 Troubleshooting

### Backend çalışmıyor
```bash
# PM2 logs kontrol et
pm2 logs crm-backend

# Port kullanımda mı?
netstat -tulpn | grep 5000

# Environment variables doğru mu?
pm2 env 0
```

### Frontend çalışmıyor
```bash
# Nginx config test
sudo nginx -t

# Nginx restart
sudo systemctl restart nginx

# Logs kontrol
tail -f /var/log/nginx/error.log
```

### Database bağlanamıyor
```bash
# PostgreSQL çalışıyor mu?
sudo systemctl status postgresql

# Remote bağlantı test
psql -h <host> -U <user> -d <database>

# pg_hba.conf kontrol et
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

## 📞 Support

Sorun yaşarsanız:
1. Logs kontrol edin (PM2, Nginx, PostgreSQL)
2. Environment variables kontrol edin
3. GitHub Issues: https://github.com/salih12s/projecrm/issues
