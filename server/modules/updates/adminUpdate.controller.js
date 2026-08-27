const service = require('./adminUpdate.service');

exports.listUpdates = async (req, res) => {
  try {
    const data = await service.listUpdates(req.user);
    res.json(data);
  } catch (err) {
    console.error('List updates error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

exports.createUpdate = async (req, res) => {
  try {
    const item = await service.createUpdate(req.body, req.user);
    res.status(201).json({ ok: true, item });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Create Failed' });
  }
};

exports.updateUpdate = async (req, res) => {
  try {
    const item = await service.updateUpdate(req.params.id, req.body, req.user);
    res.json({ ok: true, item });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Update Failed' });
  }
};

exports.deleteUpdate = async (req, res) => {
  try {
    await service.deleteUpdate(req.params.id, req.user);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Delete Failed' });
  }
};

exports.dispatchUpdateEmail = async (req, res) => {
  try {
    const result = await service.dispatchUpdateEmail(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Dispatch Failed' });
  }
};

exports.deleteScrapedUpdates = async (_req, res) => {
  try {
    const result = await service.deleteScrapedUpdates();
    res.json({
      msg: `Deleted ${result.count} scraped SIH notifications.`,
      count: result.count
    });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Cleanup Failed' });
  }
};

exports.retagAllUpdates = async (_req, res) => {
  try {
    const result = await service.retagAllUpdates();
    res.json({
      msg: `Tagged ${result.count} updates to ${result.name}.`
    });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Retagging Failed' });
  }
};

exports.uploadUpdateFile = async (req, res) => {
  try {
    const url = await service.uploadUpdateFile(req.file);
    res.json({ url });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(err.status || 500).json({ msg: err.message || 'Upload failed' });
  }
};

exports.syncSIH = async (_req, res) => {
  try {
    const result = await service.syncSIHNow();
    res.json({
      ok: true,
      msg: `Scraped ${result.scrapedCount || 0} updates from SIH portal. ${result.newUpdatesCount || 0} new updates saved!`,
      details: result
    });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to sync with SIH portal: ' + err.message });
  }
};
