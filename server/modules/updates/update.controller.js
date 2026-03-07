const updateService = require('./update.service');

/* ============================================================================
   GET PUBLIC UPDATES
============================================================================ */
exports.getPublicUpdates = async (req, res) => {
  try {
    const updates = await updateService.getPublicUpdates();
    res.json({ items: updates });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};


/* ============================================================================
   ADMIN MANUAL SCRAPE
============================================================================ */
exports.runManualScrape = async (req, res) => {
  try {
    const result = await updateService.runManualScrape();
    res.json({
      message: 'Scrape completed',
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};