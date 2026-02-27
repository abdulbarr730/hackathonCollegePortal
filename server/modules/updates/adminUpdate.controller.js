const service = require('./adminUpdate.service');

/* ============================================================================
   LIST UPDATES CONTROLLER
============================================================================ */
exports.listUpdates = async (_req, res) => {
  try {
    const data = await service.listUpdates();
    res.json(data);
  } catch (err) {
    console.error('List updates error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   CREATE UPDATE CONTROLLER
============================================================================ */
exports.createUpdate = async (req, res) => {
  try {
    const item = await service.createUpdate(req.body);
    res.status(201).json({ ok: true, item });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Create Failed' });
  }
};

/* ============================================================================
   UPDATE UPDATE CONTROLLER
============================================================================ */
exports.updateUpdate = async (req, res) => {
  try {
    const item = await service.updateUpdate(req.params.id, req.body);
    res.json({ ok: true, item });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Update Failed' });
  }
};


/* ============================================================================
   DELETE UPDATE CONTROLLER
============================================================================ */
exports.deleteUpdate = async (req, res) => {
  try {
    await service.deleteUpdate(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (err) {
    res.status(err.status || 500).json({ msg: err.message || 'Delete Failed' });
  }
};

/* ============================================================================
   RETAG UPDATES CONTROLLER
============================================================================ */
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

/* ============================================================================
   UPLOAD FILE TO SUPABASE CONTROLLER
============================================================================ */
exports.uploadUpdateFile = async (req, res) => {
  try {
    const url = await service.uploadUpdateFile(req.file);
    res.json({ url });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(err.status || 500).json({ msg: err.message || 'Upload failed' });
  }
};