const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const createTables = require('./createTables');
const authRoutes = require('./routes/auth');
const islemlerRoutes = require('./routes/islemler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
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

// Ana route
app.get('/', (req, res) => {
  res.json({ message: 'CRM API çalışıyor' });
});

const PORT = process.env.PORT || 5000;

// Tabloları oluştur ve sunucuyu başlat
createTables().then(() => {
  server.listen(PORT, () => {
    console.log(`Server ${PORT} portunda çalışıyor`);
  });
});

module.exports = { app, io };
