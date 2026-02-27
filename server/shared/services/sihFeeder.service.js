// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const crypto = require('crypto');
// const Update = require('../models/Update');
// const Hackathon = require('../models/Hackathon');

// puppeteer.use(StealthPlugin());

// const runFeederOnce = async ({ sourceUrl, useHeadlessFallback }) => {
//   console.log('🧠 Starting Intelligent SIH Scraper...');
//   let browser;
//   let inserted = 0;
//   let deleted = 0;

//   try {
//     // 1. FETCH ALL SIH EDITIONS (So we can match years)
//     const allHackathons = await Hackathon.find({
//       $or: [{ name: /Smart India/i }, { shortName: /SIH/i }]
//     });

//     // 2. IDENTIFY ACTIVE EDITION (Fallback)
//     const activeHackathon = allHackathons.find(h => h.isActive);
    
//     // Helper: Find the best hackathon match for a text string
//     const detectHackathonID = (text) => {
//       // A. Look for specific years in the text (e.g., "2025", "2026")
//       const yearMatch = text.match(/\b(202[0-9])\b/);
//       if (yearMatch) {
//         const year = parseInt(yearMatch[1]);
//         // Find a hackathon stored in DB that matches this year (via startDate)
//         const matched = allHackathons.find(h => 
//           h.startDate && new Date(h.startDate).getFullYear() === year
//         );
//         if (matched) return matched._id;
//       }
      
//       // B. If no year found, fallback to ACTIVE edition
//       return activeHackathon ? activeHackathon._id : null;
//     };

//     console.log(`📚 Loaded ${allHackathons.length} Editions for Context Matching.`);

//     // 3. LAUNCH BROWSER
//     browser = await puppeteer.launch({
//       headless: useHeadlessFallback ? "new" : false,
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
//     const page = await browser.newPage();
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
//     await page.goto(sourceUrl, { waitUntil: 'networkidle2', timeout: 60000 });

//     // 4. SCRAPE CONTENT
//     const liveUpdates = await page.evaluate(() => {
//       const items = [];
//       const seen = new Set(); // Dedup inside page context

//       const addItem = (t, u, s, p) => {
//         if (!t || t.length < 5) return;
//         const key = t + u;
//         if (!seen.has(key)) {
//           seen.add(key);
//           items.push({ title: t, summary: s, url: u, pinned: p });
//         }
//       };

//       // A. Banners
//       document.querySelectorAll('.carousel-item').forEach((slide) => {
//         const title = slide.querySelector('h2, h3, h4')?.innerText.trim();
//         const summary = slide.querySelector('p')?.innerText.trim();
//         const url = slide.querySelector('a')?.href || "https://www.sih.gov.in";
//         addItem(title, url, summary, true);
//       });

//       // B. Latest News
//       const container = document.querySelector('#latest_news') || document.body;
//       container.querySelectorAll('.news-item, .marquee-item, li, a').forEach((el) => {
//         const title = el.innerText.trim();
//         const link = el.querySelector('a') || (el.tagName === 'A' ? el : null);
//         const url = link ? link.href : "https://www.sih.gov.in";
//         // Filter out tiny nav links
//         if (title.length > 10 && !title.includes("Login")) {
//            addItem(title, url, title, false);
//         }
//       });
//       return items;
//     });

//     // 5. PROCESS UPDATES (Smart Tagging)
//     const liveHashes = new Set();
//     const updatesToInsert = [];

//     for (const item of liveUpdates) {
//       const uniqueString = `${item.title.trim()}${item.url}`;
//       const hash = crypto.createHash('sha256').update(uniqueString).digest('hex');
//       liveHashes.add(hash);

//       const exists = await Update.findOne({ hash });
      
//       // Determine the correct tag based on the title content
//       const smartHackathonId = detectHackathonID(item.title + " " + item.summary);

//       if (!exists) {
//         updatesToInsert.push({
//           title: item.title,
//           summary: item.summary,
//           url: item.url,
//           pinned: item.pinned,
//           hash: hash,
//           isPublic: true,
//           publishedAt: new Date(),
//           source: 'scraper',
//           hackathon: smartHackathonId // <--- INTELLIGENT TAG APPLIED HERE
//         });
//       } else {
//         // OPTIONAL: If it exists but is untagged, fix it now?
//         // Let's leave existing ones alone to avoid thrashing, 
//         // use the /retag route for that.
//       }
//     }

//     if (updatesToInsert.length > 0) {
//       await Update.insertMany(updatesToInsert);
//       inserted = updatesToInsert.length;
//     }

//     // 6. SYNC DELETE (Remove old 'scraper' items not found live)
//     // We only delete items that matched ONE of our SIH editions (or were untagged SIH items)
//     const sihIds = allHackathons.map(h => h._id);
//     const dbScrapedUpdates = await Update.find({ 
//       source: 'scraper',
//       $or: [
//         { hackathon: { $in: sihIds } }, // Tagged to a SIH edition
//         { hackathon: null }             // Or Untagged (Global)
//       ]
//     });

//     const idsToDelete = dbScrapedUpdates
//       .filter(dbItem => !liveHashes.has(dbItem.hash))
//       .map(d => d._id);

//     if (idsToDelete.length > 0) {
//       await Update.deleteMany({ _id: { $in: idsToDelete } });
//       deleted = idsToDelete.length;
//     }

//     console.log(`✅ Smart Sync Complete: +${inserted} New, -${deleted} Deleted.`);
//     return { inserted, deleted };

//   } catch (err) {
//     console.error('❌ Smart Scraper Failed:', err);
//     return { error: err.message };
//   } finally {
//     if (browser) await browser.close();
//   }
// };

// module.exports = { runFeederOnce };