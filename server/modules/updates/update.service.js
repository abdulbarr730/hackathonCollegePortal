const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const crypto = require('crypto');
const cron = require('node-cron');
const Update = require('./update.model');
const Hackathon = require('../hackathons/hackathon.model');

/* ============================================================================
   UPDATE SERVICE
   Handles:
     1. Puppeteer scraping of the SIH website
     2. Cron job scheduling
     3. Business logic for fetching updates (called by update.controller.js)
============================================================================ */


// =============================================================================
// SCRAPER — extract banners + latest updates from the SIH website
// =============================================================================
/**
 * Launches a stealth Puppeteer browser, navigates to sih.gov.in,
 * extracts banner slides and "Latest Updates" section items,
 * deduplicates via MD5 hash, and persists any new records to MongoDB.
 *
 * Called on server start and by the cron job every 2 hours.
 */
const scrapeSIHUpdates = async () => {
  console.log('Launching stealth browser for scraping...');
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/91.0.4472.124 Safari/537.36'
    );

    console.log('Navigating to SIH website...');
    await page.goto('https://www.sih.gov.in/', {
      waitUntil: 'networkidle2',
      timeout:   60000,
    });

    // Give JS-rendered content a moment to settle
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('Extracting banners and updates...');

    // ── DOM evaluation — runs inside the browser context ─────────────────────
    const { bannerUpdates, latestUpdates } = await page.evaluate(() => {
      // --- Banner slides ---
      const bannerArray = [];
      const bannerSlides = document.querySelectorAll('.carousel-item, .item');

      bannerSlides.forEach((slide, idx) => {
        let title   = slide.querySelector('h2, h3, h4')?.innerText.trim();
        const summary = slide.querySelector('p')?.innerText.trim();
        const url     = slide.querySelector('a')?.href || window.location.origin;

        // Fallback title — avoid generic "Slide One" labels
        if (!title || title.toLowerCase().includes('slide')) {
          title = `Banner Update ${idx + 1}`;
        }

        bannerArray.push({
          title,
          summary,
          url,
          date: new Date().toISOString(),
        });
      });

      // --- Latest Updates section ---
      const updatesArray = [];
      const updatesHeading = Array.from(document.querySelectorAll('h2, h3'))
        .find((h) => h.innerText.trim().includes('Latest Updates'));

      if (updatesHeading) {
        const container = updatesHeading.closest('.container');
        if (container) {
          const items = container.querySelectorAll('.col-md-6');
          items.forEach((el) => {
            const title   = el.querySelector('h4')?.innerText.trim();
            const summary = el.querySelector('p')?.innerText.trim();
            const url     = el.querySelector('a')?.href;
            const date    = el.querySelector('small')?.innerText.trim();
            if (title && url) {
              updatesArray.push({ title, summary, url, date });
            }
          });
        }
      }

      return { bannerUpdates: bannerArray, latestUpdates: updatesArray };
    });

    console.log(
      `Found ${bannerUpdates.length} banners + ${latestUpdates.length} latest updates.`
    );

    // ── Persist new records ───────────────────────────────────────────────────
    const allUpdates = [...bannerUpdates, ...latestUpdates];
    let newUpdatesFound = 0;

    for (const update of allUpdates) {
      // MD5 of title + url acts as a lightweight deduplication key
      const hash = crypto
        .createHash('md5')
        .update(update.title + update.url)
        .digest('hex');

      const exists = await Update.findOne({ hash });

      if (!exists) {
        const newUpdate = new Update({
          title:       update.title,
          summary:     update.summary,
          url:         update.url,
          publishedAt: update.date ? new Date(update.date) : new Date(),
          hash,
        });
        await newUpdate.save();
        console.log(`✅ New update saved: "${update.title}"`);
        newUpdatesFound++;
      }
    }

    if (newUpdatesFound === 0) {
      console.log('No new SIH updates found.');
    }

  } catch (error) {
    console.error('Error during Puppeteer scraping:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Browser closed.');
    }
  }
};


// =============================================================================
// CRON JOB — run scraper every 2 hours
// =============================================================================
/**
 * Schedules scrapeSIHUpdates to run automatically every 2 hours.
 * Called once during server bootstrap (from update.routes.js or app.js).
 */
const startScraperCron = () => {
  cron.schedule('0 */2 * * *', () => {
    console.log('Running scheduled SIH update scrape...');
    scrapeSIHUpdates();
  });

  // Also run immediately on server start so the DB is populated right away
  scrapeSIHUpdates();
};


// =============================================================================
// GET PUBLIC UPDATES
// =============================================================================
/**
 * Fetches public updates for the active hackathon.
 *
 * Strategy:
 *  1. Find the active hackathon
 *  2. Return updates scoped to that hackathon (pinned first, then by date)
 *  3. Fallback — if no hackathon-scoped updates exist, return the 10 most
 *     recent public updates so the dashboard never appears empty
 *
 * @returns {Promise<{ items: Update[] }>}
 */
const getPublicUpdates = async () => {
  // 1. Get active hackathon
  const activeHackathon = await Hackathon.findOne({ isActive: true });

  let updates = [];

  // 2. Try hackathon-scoped updates first
  if (activeHackathon) {
    updates = await Update.find({
      isPublic:  true,
      hackathon: activeHackathon._id,
    })
      .populate('hackathon', 'name shortName')
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 });
  }

  // 3. Fallback — show recent updates if none found for active hackathon
  if (!updates.length) {
    console.log('No active hackathon updates, showing recent updates instead.');

    updates = await Update.find({ isPublic: true })
      .populate('hackathon', 'name shortName')
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(10); // Keep the dashboard clean
  }

  return { items: updates };
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  scrapeSIHUpdates,
  startScraperCron,
  getPublicUpdates,
};