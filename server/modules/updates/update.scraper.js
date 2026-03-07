const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const crypto = require('crypto');
const Update = require('./update.model');

puppeteer.use(StealthPlugin());

/* ============================================================================
   SCRAPE ONLY "LATEST UPDATES" SECTION
============================================================================ */
exports.scrapeSIH = async () => {

  let browser;
  let newUpdates = 0;

  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('https://www.sih.gov.in/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 4000));

    const updates = await page.evaluate(() => {

      const results = [];

      // 1️⃣ Find "Latest Updates" heading
      const heading = Array.from(
        document.querySelectorAll('h2, h3')
      ).find(h => h.innerText.trim().includes('Latest Updates'));

      if (!heading) return results;

      // 2️⃣ Find container
      const container = heading.closest('.container');

      if (!container) return results;

      // 3️⃣ Extract update cards
      const cards = container.querySelectorAll('.col-md-6');

      cards.forEach(card => {

        const title = card.querySelector('h4')?.innerText.trim();
        const summary = card.querySelector('p')?.innerText.trim();
        const url = card.querySelector('a')?.href;
        const dateText = card.querySelector('small')?.innerText.trim();

        if (title && url) {
          results.push({
            title,
            summary,
            url,
            date: dateText || new Date().toISOString()
          });
        }
      });

      return results;
    });

    console.log(`Scraped ${updates.length} latest updates`);

    for (const item of updates) {

      const hash = crypto
        .createHash('md5')
        .update(item.title + item.url)
        .digest('hex');

      const exists = await Update.findOne({ hash });

      if (!exists) {
        await Update.create({
          title: item.title,
          summary: item.summary || '',
          url: item.url,
          publishedAt: item.date ? new Date(item.date) : new Date(),
          hash,
          isPublic: true
        });

        newUpdates++;
        console.log(`New update saved: ${item.title}`);
      }
    }

    return { newUpdates };

  } catch (err) {
    console.error('Scraper error:', err.message);
    throw err;

  } finally {
    if (browser) await browser.close();
  }
};