const updateService = require('./update.service');

/* ============================================================================
   UPDATE CONTROLLER
   Thin HTTP layer — extracts params, calls the service, and sends the response.
   All business logic lives in update.service.js.
============================================================================ */


// =============================================================================
// GET PUBLIC UPDATES   GET /api/updates
// =============================================================================
/**
 * Returns public updates scoped to the active hackathon.
 * Falls back to the 10 most recent public updates when none are found.
 * Access: Public
 */
const getPublicUpdates = async (req, res) => {
  try {
    const result = await updateService.getPublicUpdates();
    res.json(result);

  } catch (err) {
    console.error('Error in GET /api/updates:', err);
    res.status(500).send('Server Error');
  }
};


// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  getPublicUpdates,
};