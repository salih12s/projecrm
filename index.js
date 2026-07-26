// ProjeCRM üretim ortamı başlangıç noktası
process.env.NODE_ENV = 'production';
require('dotenv').config();
require('./backend/dist/server.js');
