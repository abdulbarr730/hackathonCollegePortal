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
const { notifyUsersNewUpdates } = require('./shared/services/updateNotifications.service');
// -------------------- Feeder scheduler --------------------
// 1. DEFINE THE VARIABLES FIRST
const FEEDER_ENABLED = String(process.env.FEEDER_ENABLED || 'true') === 'true';
const FEEDER_CRON = process.env.FEEDER_CRON || '*/15 * * * *';
const FEEDER_SOURCE_URL = process.env.FEEDER_SOURCE_URL || 'https://sih.gov.in/';
const PLAYWRIGHT_ENABLED = String(process.env.PLAYWRIGHT_ENABLED || 'true') === 'true';
let runFeederOnce = null;
if (FEEDER_ENABLED) {
  const { scrapeSIH } = require('./modules/updates/update.scraper');
  
  // Initial scrape on server boot (after 5 seconds delay)
  setTimeout(() => {
    console.log('🚀 Running initial SIH update scrape on server startup...');
    scrapeSIH().catch(e => console.error('Initial SIH scrape error:', e.message));
  }, 5000);

  // Scheduled recurring scrape every 30 minutes
  cron.schedule(FEEDER_CRON, () => {
    console.log('⏰ Running scheduled SIH scraper cron...');
    scrapeSIH().catch(e => console.error('Scheduled SIH scrape error:', e.message));
  });
}));

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
