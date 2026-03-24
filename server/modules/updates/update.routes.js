const express = require('express');
const router  = express.Router();
const updateController = require('./update.controller');
const { startScraperCron } = require('./update.service');

/* ============================================================================
   UPDATE ROUTES
   Base path (mounted in app.js):  /api/updates

   Side-effect on require:
     startScraperCron() is called here so the Puppeteer scraper starts up and
     the cron job is registered as soon as this module is loaded by the server.
     If you prefer to control startup timing yourself, move this call to app.js.
============================================================================ */


// ── Start the scraper + cron job when the server boots ───────────────────────
startScraperCron();


// GET /api/updates — Public updates for the active hackathon dashboard
router.get('/', updateController.getPublicUpdates);


module.exports = router;