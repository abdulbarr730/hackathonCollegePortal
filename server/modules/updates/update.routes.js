const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cron = require('node-cron');
const Update = require('./update.model');
const auth = require('../../core/middlewares/auth');
const crypto = require('crypto');

const scrapeSIHUpdates = async () => {
  console.log('Launching stealth browser for scraping...');
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    console.log('Navigating to SIH website...');
    await page.goto('https://www.sih.gov.in/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('Extracting banners and updates...');

    const { bannerUpdates, latestUpdates } = await page.evaluate(() => {
      const bannerArray = [];
      const bannerSlides = document.querySelectorAll('.carousel-item, .item');
      bannerSlides.forEach((slide, idx) => {
        let title = slide.querySelector('h2, h3, h4')?.innerText.trim();
        const summary = slide.querySelector('p')?.innerText.trim();
        const url = slide.querySelector('a')?.href || window.location.origin;
        if (!title || title.toLowerCase().includes('slide')) {
          title = `Banner Update ${idx + 1}`; // fallback instead of "Slide One"
        }
        bannerArray.push({
          title,
          summary,
          url,
          date: new Date().toISOString()
        });
      });

      const updatesArray = [];
      const updatesHeading = Array.from(document.querySelectorAll('h2, h3'))
        .find(h => h.innerText.trim().includes('Latest Updates'));

      if (updatesHeading) {
        const container = updatesHeading.closest('.container');
        if (container) {
          const items = container.querySelectorAll('.col-md-6');
          items.forEach(el => {
            const title = el.querySelector('h4')?.innerText.trim();
            const summary = el.querySelector('p')?.innerText.trim();
            const url = el.querySelector('a')?.href;
            const date = el.querySelector('small')?.innerText.trim();
            if (title && url) {
              updatesArray.push({ title, summary, url, date });
            }
          });
        }
      }

      return { bannerUpdates: bannerArray, latestUpdates: updatesArray };
    });

    console.log(`Found ${bannerUpdates.length} banners + ${latestUpdates.length} latest updates.`);

    const allUpdates = [...bannerUpdates, ...latestUpdates];
    let newUpdatesFound = 0;

    for (const update of allUpdates) {
      const hash = crypto.createHash('md5').update(update.title + update.url).digest('hex');

      const exists = await Update.findOne({ hash });
      if (!exists) {
        const newUpdate = new Update({
          title: update.title,
          summary: update.summary,
          url: update.url,
          publishedAt: update.date ? new Date(update.date) : new Date(),
          hash
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

// Run every 2 hours
cron.schedule('0 */2 * * *', () => {
  console.log('Running scheduled SIH update scrape...');
  scrapeSIHUpdates();
});

// Run once on server start
scrapeSIHUpdates();

// @route   GET /api/updates
// @desc    Get the pinned public updates for the dashboard
// @access  Public
// @route   GET /api/public/updates
// @desc    Get updates ONLY for active hackathon
// @access  Public
router.get('/', async (req, res) => {
  try {
    const Hackathon = require('../hackathons/hackathon.model');

    // 1️⃣ Get active hackathon
    const activeHackathon = await Hackathon.findOne({ isActive: true });

    let updates = [];

    // 2️⃣ Try to get updates for active hackathon
    if (activeHackathon) {
      updates = await Update.find({
        isPublic: true,
        hackathon: activeHackathon._id
      })
        .populate('hackathon', 'name shortName')
        .sort({ pinned: -1, publishedAt: -1, createdAt: -1 });
    }

    // 3️⃣ FALLBACK → show recent updates if none found
    if (!updates.length) {
      console.log('No active hackathon updates, showing recent updates instead');

      updates = await Update.find({ isPublic: true })
        .populate('hackathon', 'name shortName')
        .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
        .limit(10);   // only show latest 10 so page stays clean
    }

    res.json({ items: updates });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});




// Admin-protected endpoint
// @route   GET /api/public/updates
// @desc    Get updates ONLY for active hackathon
// @access  Public
router.get('/', async (req, res) => {
  try {
    const Hackathon = require('../hackathons/hackathon.model');

    // 1️⃣ Get active hackathon
    const activeHackathon = await Hackathon.findOne({ isActive: true });

    let updates = [];

    // 2️⃣ Try to get updates for active hackathon
    if (activeHackathon) {
      updates = await Update.find({
        isPublic: true,
        hackathon: activeHackathon._id
      })
        .populate('hackathon', 'name shortName')
        .sort({ pinned: -1, publishedAt: -1, createdAt: -1 });
    }

    // 3️⃣ FALLBACK → show recent updates if none found
    if (!updates.length) {
      console.log('No active hackathon updates, showing recent updates instead');

      updates = await Update.find({ isPublic: true })
        .populate('hackathon', 'name shortName')
        .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
        .limit(10);   // only show latest 10 so page stays clean
    }

    res.json({ items: updates });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});




module.exports = router;
