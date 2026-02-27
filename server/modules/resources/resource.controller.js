const service = require('./resource.service');

/* ============================================================================
   URL RESOURCE CONTROLLER
============================================================================ */
exports.createUrlResource = async (req, res) => {
  try {
    const resource = await service.createUrlResource(
      req.body,
      req.user._id
    );

    res.status(201).json({
      msg: 'Submitted for review',
      resource
    });

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};

/* ============================================================================
   FILE RESOURCE CONTROLLER
============================================================================ */
exports.createFileResource = async (req, res) => {
  try {
    const resource = await service.createFileResource(
      req.body,
      req.file,
      req.user._id
    );

    res.status(201).json({
      msg: 'File submitted for review',
      resource
    });

  } catch (err) {
    console.error('FILE UPLOAD ERROR:', err);  // ADD THIS
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};

/* ============================================================================
   LIST APPROVED RESOURCES
============================================================================ */
exports.listApprovedResources = async (req, res) => {
  try {
    const data = await service.listApprovedResources(req.query);
    res.json(data);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   GET APPROVED CATEGORIES
============================================================================ */
exports.getApprovedCategories = async (_req, res) => {
  try {
    const categories = await service.getApprovedCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   VIEW FILE CONTROLLER
============================================================================ */
exports.viewFile = async (req, res) => {
  try {
    const file = await service.viewFile(req.params.id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.send(file.buffer);

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Failed to fetch file'
    });
  }
};

/* ============================================================================
   DOWNLOAD FILE CONTROLLER
============================================================================ */
exports.downloadFile = async (req, res) => {
  try {
    const file = await service.downloadFile(req.params.id);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`
    );

    res.send(file.buffer);

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Failed to download file'
    });
  }
};