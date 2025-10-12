// Production entry point for Railway deployment
process.env.NODE_ENV = 'production';
require('dotenv').config();
require('./backend/dist/server.js');
