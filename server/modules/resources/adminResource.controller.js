const service = require('./adminResource.service');

/* ============================================================================
   LIST RESOURCES CONTROLLER
============================================================================ */
exports.listResources = async (req, res) => {
  try {
    const data = await service.listResources(req.query);
    return res.json(data);
  } catch (err) {
    console.error('Admin list error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   APPROVE RESOURCE CONTROLLER
============================================================================ */
exports.approveResource = async (req, res) => {
  try {
    const doc = await service.approveResource(
      req.params.id,
      req.user?._id
    );

    return res.json({ msg: 'Approved', resource: doc });

  } catch (err) {
    console.error('Approve error:', err);
    return res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};


/* ============================================================================
   REJECT RESOURCE CONTROLLER
============================================================================ */
exports.rejectResource = async (req, res) => {
  try {
    const { reason = '' } = req.body || {};

    const doc = await service.rejectResource(
      req.params.id,
      reason
    );

    return res.json({ msg: 'Rejected', resource: doc });

  } catch (err) {
    console.error('Reject error:', err);
    return res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

/* ============================================================================
   UPDATE RESOURCE CONTROLLER
============================================================================ */
exports.updateResource = async (req, res) => {
  try {
    const doc = await service.updateResource(req.params.id, req.body);
    return res.json({ msg: 'Resource updated', resource: doc });
  } catch (err) {
    console.error('Update error:', err);
    return res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};


/* ============================================================================
   DELETE RESOURCE CONTROLLER
============================================================================ */
exports.deleteResource = async (req, res) => {
  try {
    await service.deleteResource(req.params.id);
    return res.json({ msg: 'Deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

/* ============================================================================
   BULK DELETE CONTROLLER
============================================================================ */
exports.bulkDeleteResources = async (req, res) => {
  try {
    const result = await service.bulkDeleteResources(req.body?.ids);
    return res.json({
      msg: 'Bulk delete completed',
      ...result
    });
  } catch (err) {
    console.error('Bulk delete error:', err);
    return res.status(err.status || 500).json({ msg: err.message || 'Server Error' });
  }
};

/* ============================================================================
   VIEW FILE CONTROLLER
============================================================================ */
exports.viewResource = async (req, res) => {
  try {
    const url = await service.getViewUrl(req.params.id);
    return res.redirect(url);
  } catch (err) {
    console.error('View file error:', err);
    return res.status(err.status || 500).send(err.message || 'Server Error');
  }
};


/* ============================================================================
   DOWNLOAD FILE CONTROLLER
============================================================================ */
exports.downloadResource = async (req, res) => {
  try {
    const url = await service.getDownloadUrl(req.params.id);
    return res.redirect(url);
  } catch (err) {
    console.error('Download file error:', err);
    return res.status(err.status || 500).send(err.message || 'Server Error');
  }
};

/* ============================================================================
   COUNTS CONTROLLER
============================================================================ */
exports.getCounts = async (_req, res) => {
  try {
    const data = await service.getCounts();
    return res.json(data);
  } catch (err) {
    console.error('Counts error:', err);
    return res.status(500).json({ msg: 'Server Error' });
  }
};