const service = require('./comment.service');

/* ============================================================================
   ADD COMMENT CONTROLLER
============================================================================ */
exports.addComment = async (req, res) => {
  try {
    const comment = await service.addComment(
      req.params.id,
      req.body.text,
      req.user.id
    );

    res.status(201).json(comment);
  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};

/* ============================================================================
   DELETE COMMENT CONTROLLER
============================================================================ */
exports.deleteComment = async (req, res) => {
  try {
    await service.deleteComment(
      req.params.id,
      req.user.id
    );

    res.json({ msg: 'Comment removed' });

  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};