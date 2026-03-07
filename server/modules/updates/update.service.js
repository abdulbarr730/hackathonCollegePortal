const Update = require('./update.model');
const Hackathon = require('../hackathons/hackathon.model');
const { scrapeSIH } = require('./update.scraper');

/* ============================================================================
   GET PUBLIC UPDATES (ACTIVE HACKATHON FIRST)
============================================================================ */
exports.getPublicUpdates = async () => {

  const activeHackathon = await Hackathon.findOne({ isActive: true });

  let updates = [];

  if (activeHackathon) {
    updates = await Update.find({
      isPublic: true,
      hackathon: activeHackathon._id
    })
      .populate('hackathon', 'name shortName')
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 });
  }

  if (!updates.length) {
    updates = await Update.find({ isPublic: true })
      .populate('hackathon', 'name shortName')
      .sort({ pinned: -1, publishedAt: -1, createdAt: -1 })
      .limit(10);
  }

  return updates;
};


/* ============================================================================
   MANUAL SCRAPER TRIGGER
============================================================================ */
exports.runManualScrape = async () => {
  return await scrapeSIH();
};