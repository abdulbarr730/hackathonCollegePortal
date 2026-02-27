// server/index.js
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const requireAuth = require('./core/middlewares/auth');
const User = require('./modules/users/user.model');
const errorHandler = require('./core/middlewares/errorHandler');


// --- REMOVE THIS if you replaced it with the generic hackathonRoutes file I gave you ---
// const adminHackathonRoutes = require('./routes/adminHackathonRoutes'); 
// -------------------------------------------------------------------------------------

// Feeder + notifications
const cron = require('node-cron');
const { runFeederOnce } = require('./shared/services/sihFeeder.service');
const { notifyUsersNewUpdates } = require('./shared/services/updateNotifications.service');
// -------------------- Feeder scheduler --------------------
// 1. DEFINE THE VARIABLES FIRST
const FEEDER_ENABLED = String(process.env.FEEDER_ENABLED || 'true') === 'true';
const FEEDER_CRON = process.env.FEEDER_CRON || '*/15 * * * *';
const FEEDER_SOURCE_URL = process.env.FEEDER_SOURCE_URL || 'https://sih.gov.in/';
const PLAYWRIGHT_ENABLED = String(process.env.PLAYWRIGHT_ENABLED || 'true') === 'true';

// DB
const connectDB = require('./core/database/db');

const app = express();

// Connect DB
connectDB();

// Core middleware
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads/resources')));
app.use(cors({ origin: process.env.CLIENT_URL , credentials: true }));
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/avatars', express.static(path.join(__dirname, '..', 'uploads', 'avatars')));

// Optional request logging
app.use((req, _res, next) => {
  if (req.path.startsWith('/api/admin/users/export.csv')) {
    console.log('CSV export request', {
      q: req.query?.q,
      verified: req.query?.verified,
      admin: req.query?.admin,
    });
  }
  next();
});

const registerRoutes = require('./modules/index');
registerRoutes(app);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Server Error' });
});

if (FEEDER_ENABLED) {
  // Use a standard function and wrap the async logic inside
  cron.schedule(FEEDER_CRON, () => {
    console.log('Running SIH feeder cron job...');
    // Self-invoking async function to handle the promise-based logic
    (async () => {
      try {
        const { inserted, insertedDocs, error } = await runFeederOnce({
          sourceUrl: FEEDER_SOURCE_URL,
          useHeadlessFallback: PLAYWRIGHT_ENABLED,
        });

        if (insertedDocs?.length) {
          notifyUsersNewUpdates(insertedDocs).catch(e =>
            console.error('notifyUsersNewUpdates error:', e)
          );
        }

        if (error) {
          console.error('Feeder run error:', error);
        } else {
          console.log(`Feeder run ok, inserted: ${inserted}`);
        }
      } catch (e) {
        console.error('Feeder cron error:', e);
      }
    })();
  });
}

const PORT = process.env.PORT || 5001;

app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});