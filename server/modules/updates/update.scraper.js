const cheerio = require('cheerio');
const crypto = require('crypto');
const Update = require('./update.model');
const Hackathon = require('../hackathons/hackathon.model');
const { notifyUsersNewUpdates } = require('../../shared/services/updateNotifications.service');

/* ============================================================================
   HIGH-RELIABILITY SIH SCRAPER (Native HTTP + Cheerio)
   100% cloud-compatible, zero memory overhead, runs on Render without Puppeteer
============================================================================ */
async function scrapeSIH() {
  console.log('🔄 Starting high-reliability SIH updates scraper...');
  const newInsertedUpdates = [];

  try {
    // 1. Fetch active hackathon for association
    const activeHackathon = await Hackathon.findOne({ 
      $or: [{ isActive: true }, { name: /Smart India/i }, { shortName: /SIH/i }] 
    }).sort({ startDate: -1 });

    // 2. Fetch official SIH homepage
    const res = await fetch('https://www.sih.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      throw new Error(`SIH Portal returned HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const scrapedItems = [];

    // Extract marquee and notification links (PDFs, guidelines, deadlines)
    $('marquee a, .marquee a, .notification a, .latest-update a, a[href*="pdf"], a[href*="letters"], a[href*="notification"]').each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const href = $(el).attr('href');

      if (text && text.length >= 8 && href && !href.startsWith('#') && !href.startsWith('javascript')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.sih.gov.in/${href.replace(/^\//, '')}`;
        scrapedItems.push({
          title: text,
          url: fullUrl,
          summary: `Official Smart India Hackathon announcement: ${text}`,
          pinned: text.toLowerCase().includes('guideline') || text.toLowerCase().includes('important')
        });
      }
    });

    // Extract card-based updates & banners
    $('.col-md-6, .col-md-4, .card, .item, .news-item, .carousel-item').each((i, el) => {
      const heading = $(el).find('h2, h3, h4, h5, strong').first().text().trim().replace(/\s+/g, ' ');
      const desc = $(el).find('p, span').first().text().trim().replace(/\s+/g, ' ');
      const link = $(el).find('a').attr('href');

      if (heading && heading.length >= 10 && heading.length <= 250 && !heading.toLowerCase().includes('slide')) {
        const fullUrl = link ? (link.startsWith('http') ? link : `https://www.sih.gov.in/${link.replace(/^\//, '')}`) : 'https://www.sih.gov.in';
        scrapedItems.push({
          title: heading,
          summary: desc || `Official notification published on Smart India Hackathon portal.`,
          url: fullUrl,
          pinned: false
        });
      }
    });

    // Deduplicate extracted batch
    const uniqueBatch = [];
    const seen = new Set();
    for (const item of scrapedItems) {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueBatch.push(item);
      }
    }

    console.log(`🔍 Scraped ${uniqueBatch.length} candidate items from SIH portal`);

    // Insert new updates into MongoDB
    for (const item of uniqueBatch) {
      const hash = crypto
        .createHash('sha256')
        .update(item.title.trim() + item.url.trim())
        .digest('hex');

      const exists = await Update.findOne({ 
        $or: [{ hash }, { title: item.title.trim() }] 
      });

      if (!exists) {
        const newDoc = await Update.create({
          title: item.title.trim(),
          summary: item.summary.trim(),
          url: item.url,
          isPublic: true,
          pinned: item.pinned || false,
          publishedAt: new Date(),
          hash,
          hackathon: activeHackathon?._id || null,
          source: 'sih_official'
        });

        newInsertedUpdates.push(newDoc);
        console.log(`✅ New SIH Update Created: "${item.title}"`);
      }
    }

    // 3. If new updates were inserted, notify all registered students & team leaders
    if (newInsertedUpdates.length > 0) {
      console.log(`📧 Dispatching update email notification for ${newInsertedUpdates.length} new SIH updates...`);
      notifyUsersNewUpdates(newInsertedUpdates).catch(e => 
        console.error('Failed to notify users of new updates:', e.message)
      );
    }

    return {
      success: true,
      scrapedCount: uniqueBatch.length,
      newUpdatesCount: newInsertedUpdates.length,
      newUpdates: newInsertedUpdates
    };

  } catch (err) {
    console.error('❌ SIH Scraper Error:', err.message);
    return {
      success: false,
      error: err.message,
      newUpdatesCount: 0
    };
  }
}

module.exports = { scrapeSIH };
