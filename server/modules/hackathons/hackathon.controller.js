const service = require('./hackathon.service');

/* ============================================================================
   ACTIVE HACKATHON CONTROLLER
============================================================================ */
exports.getActiveHackathon = async (_req, res) => {
  try {
    const data = await service.getActiveHackathon();
    res.json(data);
  } catch (err) {
    console.error('Active hackathon error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   LIST HACKATHONS CONTROLLER
============================================================================ */
exports.listHackathons = async (req, res) => {
  try {
    const data = await service.listHackathons(req.query);
    res.json(data);
  } catch (err) {
    console.error('List hackathons error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   CREATE HACKATHON CONTROLLER
============================================================================ */
exports.createHackathon = async (req, res) => {
  try {
    const hackathon = await service.createHackathon(req.body);
    res.json(hackathon);
  } catch (err) {
    console.error('Create hackathon error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   SET ACTIVE HACKATHON CONTROLLER
============================================================================ */
exports.setActiveHackathon = async (req, res) => {
  try {
    const hackathon = await service.setActiveHackathon(req.params.id);
    res.json(hackathon);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

/* ============================================================================
   UPDATE HACKATHON CONTROLLER
============================================================================ */
exports.updateHackathon = async (req, res) => {
  try {
    const hackathon = await service.updateHackathon(
      req.params.id,
      req.body
    );

    res.json(hackathon);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

/* ============================================================================
   MIGRATE LEGACY TEAMS CONTROLLER
============================================================================ */
exports.migrateLegacyTeams = async (req, res) => {
  try {
    const count = await service.migrateLegacyTeams(
      req.body.targetHackathonId
    );

    res.json({
      msg: `Migrated ${count} legacy teams successfully.`
    });

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Migration failed'
    });
  }
};

/* ============================================================================
   BULK LOCK TEAMS CONTROLLER
============================================================================ */
exports.lockAllTeams = async (req, res) => {
  try {
    const count = await service.lockAllTeams(req.body.hackathonId);

    res.json({
      msg: `Successfully locked ${count} teams for this hackathon.`
    });

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error during bulk lock'
    });
  }
};