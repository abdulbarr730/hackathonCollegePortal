// server/index.js
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const connectDB = require('./core/database/db');
const errorHandler = require('./core/middlewares/errorHandler');
const registerRoutes = require('./modules/index');
const { scrapeSIH } = require('./modules/updates/update.scraper');

const app = express();

// Connect MongoDB Database
connectDB();

// Core Middleware
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static Uploads & Public Assets
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/avatars', express.static(path.join(__dirname, '..', 'uploads', 'avatars')));
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads', 'resources')));

// Register All Module Routes
registerRoutes(app);

// Health Check Endpoint
app.get('/api/health', (_req, res) => res.json({ ok: true, timestamp: new Date() }));

// High-Reliability Automated SIH Scraper & Feeder
const FEEDER_ENABLED = String(process.env.FEEDER_ENABLED || 'true') === 'true';
const FEEDER_CRON = process.env.FEEDER_CRON || '0 * * * *';

if (FEEDER_ENABLED) {
  // Initial scrape 8 seconds after server startup
  setTimeout(() => {
    console.log('🚀 Running initial SIH update scrape on server startup...');
    scrapeSIH().catch(e => console.error('Initial SIH scrape error:', e.message));
  }, 8000);

  // Scheduled recurring scrape every 30 minutes
  cron.schedule(FEEDER_CRON, () => {
    console.log('⏰ Running scheduled SIH scraper cron...');
    scrapeSIH().catch(e => console.error('Scheduled SIH scrape error:', e.message));
  });
}

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 CampXCode Server is running on http://localhost:${PORT}`);
});
