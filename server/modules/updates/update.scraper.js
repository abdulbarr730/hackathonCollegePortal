const mongoose = require('mongoose');
const cheerio = require('cheerio');
const crypto = require('crypto');
const Update = require('./update.model');
const Hackathon = require('../hackathons/hackathon.model');
const { notifySIHUpdateScraped } = require('../../shared/services/discord.service');

const IGNORE_PATTERNS = [
  /abhay jere/i,
  /rajive kumar/i,
  /narendra modi/i,
  /dharmendra pradhan/i,
  /pralhad joshi/i,
  /sourabh nirmale/i,
  /sarim moin/i,
  /ankush sharma/i,
  /pradeep dhage/i,
  /contact us/i,
  /mailto:/i,
  /member secretary/i,
  /cio,mic/i,
  /minister of/i,
  /prime minister/i,
  /innovative solutions/i,
  /recognition and visibility/i,
  /out-of-the-box solutions/i,
  /innovation movement/i,
  /about sih/i,
  /past hackathons/i,
  /vision & mission/i,
  /hon'ble/i
];

const VALID_ANNOUNCEMENT_KEYWORDS = [
  'guideline',
  'guidelines',
  'circular',
  'notification',
  'problem statement',
  'deadline',
  'submission',
  'nomination',
  'announcement',
  'result',
  'registration',
  'schedule',
  'timeline',
  'spoc',
  'process flow',
  'internal hackathon',
  'extension',
  'shortlist',
  'evaluation',
  'grand finale',
  'hackathon 202'
];

/* ============================================================================
   HIGH-PRECISION 1-HOUR SIH OFFICIAL SCRAPER
   Captures only official guidelines, circulars, PPT formats, and deadlines.
   Posts live alerts to Discord and stages in Super Admin Dashboard for approval.
============================================================================ */
async function scrapeSIH() {
  console.log('🔄 Running precision SIH official announcements scraper...');
  const newInsertedUpdates = [];

  try {
    const activeHackathon = await Hackathon.findOne({ 
      $or: [{ isActive: true }, { name: /Smart India/i }, { shortName: /SIH/i }] 
    }).sort({ startDate: -1 });

    const res = await fetch('https://www.sih.gov.in/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(20000)
    });

    if (!res.ok) {
      throw new Error(`SIH Portal returned HTTP ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const candidateItems = [];

    // Extract marquee, announcements, PDF circulars, and notice boards
    $('marquee a, .marquee a, .notification a, .latest-update a, a[href*="pdf"], a[href*="letters"], a[href*="notification"], .col-md-6 a, .col-md-4 a, .card a').each((i, el) => {
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const href = $(el).attr('href');

      if (!text || text.length < 8 || text.length > 220) return;
      if (!href || href.startsWith('#') || href.startsWith('javascript')) return;

      // 1. Ignore people names, dignitaries, contact emails, and generic slogans
      const isIgnored = IGNORE_PATTERNS.some(p => p.test(text) || p.test(href));
      if (isIgnored) return;

      // 2. Require genuine hackathon announcement keywords
      const combined = `${text} ${href}`.toLowerCase();
      const isValid = VALID_ANNOUNCEMENT_KEYWORDS.some(kw => combined.includes(kw));
      if (!isValid) return;

      const fullUrl = href.startsWith('http') ? href : `https://www.sih.gov.in/${href.replace(/^\//, '')}`;
      const isPdf = fullUrl.toLowerCase().endsWith('.pdf');

      candidateItems.push({
        title: text,
        url: fullUrl,
        summary: isPdf 
          ? `Official Smart India Hackathon document / circular: ${text}`
          : `Official Smart India Hackathon portal announcement: ${text}`,
        pinned: isPdf || text.toLowerCase().includes('guideline')
      });
    });

    // Deduplicate
    const uniqueBatch = [];
    const seen = new Set();
    for (const item of candidateItems) {
      const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueBatch.push(item);
      }
    }

    console.log(`🔍 Found ${uniqueBatch.length} genuine SIH hackathon announcements`);

    // Insert only new records
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
          source: 'sih_official',
          college: null, // Global for all colleges
          requiresReview: true, // Super Admin approves before emailing
          emailDispatched: false
        });

        newInsertedUpdates.push(newDoc);
        console.log(`✅ Saved Genuine SIH Update: "${item.title}"`);
      }
    }

    // Trigger Discord alert if new updates were captured
    if (newInsertedUpdates.length > 0) {
      console.log(`📢 Sending Discord alert for ${newInsertedUpdates.length} new SIH updates...`);
      notifySIHUpdateScraped(newInsertedUpdates).catch(e => 
        console.error('Discord scraper alert error:', e.message)
      );
    }

    const remainingTotal = await Update.countDocuments();

    return {
      success: true,
      scrapedCount: uniqueBatch.length,
      newUpdatesCount: newInsertedUpdates.length,
      totalInDb: remainingTotal,
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
