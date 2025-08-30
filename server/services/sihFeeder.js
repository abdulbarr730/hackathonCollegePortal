// server/services/sihFeeder.js
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

const Update = require('../models/Update');
const UpdateRun = require('../models/UpdateRun');

// Headless fallback (Playwright) if static HTML doesn't contain ribbon/links
let playwright;
async function fetchWithPlaywright(url) {
  if (!playwright) playwright = await import('playwright');
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try { await page.waitForTimeout(800); } catch (_) {}
  const html = await page.content();
  await browser.close();
  return html;
}

function makeHash({ title, url, publishedAt }) {
  const base = `${title}|${url || ''}|${publishedAt || ''}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

function dedupe(list) {
  const map = new Map();
  for (const it of list) {
    const key = `${(it.title || '').trim()}|${(it.url || '').trim()}`;
    if (!map.has(key) && it.title) map.set(key, it);
  }
  return Array.from(map.values());
}

// STRICT filter: keep only true updates (e.g., SPOC registration, notices, deadlines)
function shouldKeep(title = '', url = '') {
  const t = (title || '').toLowerCase();
  const u = (url || '').toLowerCase();

  // Strong allowlist (tight)
  const allow = [
    'spoc registration',
    'spoc  registration',
    'spoc-reg',
    'spoc',
    'registration', 'registrations',
    'notice', 'notices',
    'announcement', 'announcements',
    'update', 'updates',
    'deadline', 'last date',
    'result', 'results',
    'shortlist', 'short-listed', 'short listed',
    'guideline', 'guidelines',
    'important',
    'opening', 'closing'
  ];

  // Hard block for navigation/sections
  const block = [
    'faq', 'faqs',
    'contact', 'contact us',
    'login', 'sih login',
    'about',
    'home',
    'guidelines', // generic page, not an "update"
    'ppt', 'idea ppt',
    'project implementation',
    'for institutes', 'universities',
    'internal hackathon process',
    'mic alumni',
    'sih 2023', 'sih 2024',
    'themes', 'support'
  ];

  // Block obvious homepage/anchors in URL
  const urlBlock = ['/#', '#', '/home', '/about', '/contact', '/login'];

  const contains = (arr, s) => arr.some(k => s.includes(k));

  const allowHit = contains(allow, t) || contains(allow, u);
  const blockHit = contains(block, t) || contains(block, u) || contains(urlBlock, u);

  // Require reasonably descriptive titles
  const longEnough = t.replace(/\s+/g, ' ').trim().length >= 8;

  return allowHit && !blockHit && longEnough;
}

function pushIfKept(items, title, url, baseUrl) {
  if (!title) return;
  const cleanTitle = title.replace(/\s+/g, ' ').trim();
  if (!cleanTitle || cleanTitle === '-') return;

  const finalUrl = url ? (url.startsWith('http') ? url : new URL(url, baseUrl).toString()) : baseUrl;

  // If URL is homepage-ish, only keep when title clearly looks like an update
  const isHomeish = finalUrl.endsWith('/') || finalUrl.includes('/#');
  if (isHomeish && !/spoc|registration|notice|announcement|update|deadline|result/i.test(cleanTitle)) {
    return;
  }

  if (shouldKeep(cleanTitle, finalUrl)) {
    items.push({ title: cleanTitle, url: finalUrl });
  }
}

function parseUpdatesFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  const items = [];

  // Optional override via env
  const envSel = process.env.FEEDER_RIBBON_SELECTOR;
  if (envSel && $(envSel).length) {
    $(envSel).find('a').each((_, el) => {
      const title = $(el).text().replace(/\s+/g, ' ').trim();
      const href = $(el).attr('href') || '';
      pushIfKept(items, title, href, baseUrl);
    });
    const rawText = $(envSel).text().trim();
    if (rawText && items.length === 0) {
      const parts = rawText
        .split(/[\|\u2022\u00B7•]+/g)
        .map(s => s.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
      for (const t of parts) pushIfKept(items, t, '', baseUrl);
    }
    return dedupe(items);
  }

  // Likely ribbon/ticker containers
  const ribbonSelectors = [
    '.marquee-container','.marquee-wrap','.news-marquee','.ticker-wrap',
    '.running-text','.news-bar','.news-strip','.scrolling-text',
    '.ticker','.marquee','.news-ticker','.breaking-news','.notice-ticker',
  ];

  let matched = false;
  for (const sel of ribbonSelectors) {
    const count = $(sel).length;
    if (count) {
      matched = true;
      const $c = $(sel).first();

      $c.find('a').each((_, el) => {
        const title = $(el).text().replace(/\s+/g, ' ').trim();
        const href = $(el).attr('href') || '';
        pushIfKept(items, title, href, baseUrl);
      });

      const rawText = $c.text().trim();
      if (rawText && items.length === 0) {
        const parts = rawText
          .split(/[\|\u2022\u00B7•]+/g)
          .map(s => s.replace(/\s+/g, ' ').trim())
          .filter(Boolean);
        for (const t of parts) pushIfKept(items, t, '', baseUrl);
      }
      break;
    }
  }

  // Broad probe if ribbon not matched or yielded nothing
  if (!matched || items.length === 0) {
    const probeSelectors = [
      'div[id*="marquee"]','div[class*="marquee"]','div[id*="ticker"]','div[class*="ticker"]',
      'div[class*="ribbon"]','div[class*="notice"]','div[class*="news"]','section[class*="news"]',
      'div[role="marquee"]','nav[role="marquee"]','div[class*="strip"]','div[class*="bar"]','div[class*="scroll"]',
    ];
    const $broad = $(probeSelectors.join(','));
    if ($broad.length) {
      const $target = $broad.first();
      $target.find('a').each((_, el) => {
        const title = $(el).text().replace(/\s+/g, ' ').trim();
        const href = $(el).attr('href') || '';
        pushIfKept(items, title, href, baseUrl);
      });
      if (items.length === 0) {
        const rawText = $target.text().trim();
        if (rawText) {
          const parts = rawText
            .split(/[\|\u2022\u00B7•]+/g)
            .map(s => s.replace(/\s+/g, ' ').trim())
            .filter(Boolean);
          for (const t of parts) pushIfKept(items, t, '', baseUrl);
        }
      }
    }
  }

  // Final safeguard: scan all anchors with strict filter
  if (items.length === 0) {
    $('a').each((_, el) => {
      const title = $(el).text().replace(/\s+/g, ' ').trim();
      const href = $(el).attr('href');
      if (!title || !href) return;
      pushIfKept(items, title, href, baseUrl);
    });
  }

  return dedupe(items);
}

async function runFeederOnce({ sourceUrl, useHeadlessFallback = true } = {}) {
  const run = new UpdateRun({ startedAt: new Date() });

  try {
    let html;
    try {
      const resp = await axios.get(sourceUrl, {
        timeout: 60000,
        headers: {
          'User-Agent': 'SIH-Portal-Feeder/1.0 (+contact: admin@sih-portal.local)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      html = resp.data;
    } catch (httpErr) {
      if (!useHeadlessFallback) throw httpErr;
      html = await fetchWithPlaywright(sourceUrl);
    }

    let parsed = parseUpdatesFromHtml(html, sourceUrl);
    if ((!parsed || parsed.length === 0) && useHeadlessFallback) {
      const html2 = await fetchWithPlaywright(sourceUrl);
      parsed = parseUpdatesFromHtml(html2, sourceUrl);
    }

    run.itemsFetched = Array.isArray(parsed) ? parsed.length : 0;
    if (!parsed || parsed.length === 0) {
      run.ok = true;
      run.finishedAt = new Date();
      await run.save();
      return { inserted: 0, insertedDocs: [] };
    }

    const toInsert = [];
    for (const it of parsed) {
      const hash = makeHash({
        title: it.title,
        url: it.url,
        publishedAt: it.publishedAt ? new Date(it.publishedAt).toISOString() : '',
      });
      const exists = await Update.findOne({ source: 'sih', hash }).select('_id').lean();
      if (exists) continue;

      toInsert.push({
        title: it.title,
        url: it.url || '',
        summary: '',
        publishedAt: it.publishedAt || undefined,
        source: 'sih',
        hash,
        pinned: false,
        isPublic: true,
      });
    }

    let insertedDocs = [];
    if (toInsert.length) {
      const result = await Update.insertMany(toInsert, { ordered: false });
      insertedDocs = result.map(d => d.toObject());
    }

    run.itemsInserted = insertedDocs.length;
    run.ok = true;
    run.finishedAt = new Date();
    await run.save();

    return { inserted: insertedDocs.length, insertedDocs };
  } catch (err) {
    run.ok = false;
    run.errorMessage = err?.message || String(err);
    run.finishedAt = new Date();
    await run.save();
    return { error: run.errorMessage, inserted: 0, insertedDocs: [] };
  }
}

module.exports = { runFeederOnce };
