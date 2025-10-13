import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import createTables from './createTables';
import { initLocations } from './initLocations';
import authRoutes from './routes/auth';
import islemlerRoutes from './routes/islemler';
import teknisyenlerRoutes from './routes/teknisyenler';
import markalarRoutes from './routes/markalar';
import bayilerRoutes from './routes/bayiler';
import atolyeRoutes from './routes/atolye';
import adminRoutes from './routes/admin';
import montajlarRoutes from './routes/montajlar';
import aksesuarlarRoutes from './routes/aksesuarlar';
import urunlerRoutes from './routes/urunler';
import locationsRoutes from './routes/locations';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS origin - development ve production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://crm-msssoft.com',
  'https://www.crm-msssoft.com',
  'https://projecrm-production.up.railway.app',
  process.env.FRONTEND_URL || '',
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Socket.IO bağlantısı
io.on('connection', (socket) => {
  console.log('Yeni kullanıcı bağlandı:', socket.id);

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

// Socket.IO'yu app'e ekle
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/islemler', islemlerRoutes);
app.use('/api/teknisyenler', teknisyenlerRoutes);
app.use('/api/markalar', markalarRoutes);
app.use('/api/bayiler', bayilerRoutes);
app.use('/api/atolye', atolyeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/montajlar', montajlarRoutes);
app.use('/api/aksesuarlar', aksesuarlarRoutes);
app.use('/api/urunler', urunlerRoutes);
app.use('/api/ilceler', locationsRoutes);

// Serve static files from frontend build (production only)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Ana route (development)
  app.get('/', (_req, res) => {
    res.json({ message: 'CRM API çalışıyor' });
  });
}

const PORT = process.env.PORT || 5000;

// Tabloları oluştur, location data'yı yükle ve sunucuyu başlat
createTables()
  .then(() => initLocations())
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server ${PORT} portunda çalışıyor`);
    });
  })
  .catch((error) => {
    console.error('Başlatma hatası:', error);
    process.exit(1);
  });

export { app, io };
