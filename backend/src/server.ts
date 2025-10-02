import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import createTables from './createTables';
import authRoutes from './routes/auth';
import islemlerRoutes from './routes/islemler';
import teknisyenlerRoutes from './routes/teknisyenler';
import markalarRoutes from './routes/markalar';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Middleware
app.use(cors());
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

// Ana route
app.get('/', (_req, res) => {
  res.json({ message: 'CRM API çalışıyor' });
});

const PORT = process.env.PORT || 5000;

// Tabloları oluştur ve sunucuyu başlat
createTables().then(() => {
  server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
  });
});

export { app, io };
