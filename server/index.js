// server/index.js
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const requireAuth = require('./middleware/auth');
const User = require('./models/User');


// Feeder + notifications
const cron = require('node-cron');
const { runFeederOnce } = require('./services/sihFeeder');
const { notifyUsersNewUpdates } = require('./services/updateNotifications');

// DB
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

// Core middleware
app.use('/uploads/resources', express.static(path.join(__dirname, 'uploads/resources')));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads from the project root's 'uploads' directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads/avatars', express.static(path.join(__dirname, '..', 'uploads', 'avatars')));

// Optional request logging for specific route
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

// -------------------- Routes --------------------

// Existing routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/me', require('./routes/meRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/ideas', require('./routes/ideaRoutes'));
app.use('/api/updates', require('./routes/updateRoutes'));
// app.use('/api/public/spoc', require('./routes/publicSpocRoute'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/admin/resources', require('./routes/adminResourceRoutes'));
app.use('/api/public/updates', require('./routes/publicUpdateRoutes'));
app.use('/api/admin/updates', require('./routes/adminUpdateRoutes'));
app.use('/api/users/social', require('./routes/socialRoutes'));
app.use('/api/admin/social-config', require('./routes/adminSocialConfigRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));

// Pointing to the new, self-contained profile route file
app.use('/api/profile', require('./routes/profileRoutes'));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Server Error' });
});

// -------------------- Feeder scheduler (Corrected) --------------------
const FEEDER_ENABLED = String(process.env.FEEDER_ENABLED || 'true') === 'true';
const FEEDER_CRON = process.env.FEEDER_CRON || '*/15 * * * *';
const FEEDER_SOURCE_URL = process.env.FEEDER_SOURCE_URL || 'https.sih.gov.in/';
const PLAYWRIGHT_ENABLED = String(process.env.PLAYWRIGHT_ENABLED || 'true') === 'true';

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

// -------------------- Start server --------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});