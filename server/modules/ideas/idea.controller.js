const service = require('./idea.service');

/* ============================================================================
   CREATE IDEA CONTROLLER
============================================================================ */
exports.createIdea = async (req, res) => {
  try {
    const idea = await service.createIdea(req.body, req.user.id);
    res.status(201).json(idea);
  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};

/* ============================================================================
   GET ALL IDEAS CONTROLLER
============================================================================ */
exports.getAllIdeas = async (_req, res) => {
  try {
    const ideas = await service.getAllIdeas();
    res.json(ideas);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
};

/* ============================================================================
   GET IDEA WITH COMMENTS CONTROLLER
============================================================================ */
exports.getIdeaWithComments = async (req, res) => {
  try {
    const data = await service.getIdeaWithComments(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};

/* ============================================================================
   DELETE IDEA CONTROLLER
============================================================================ */
exports.deleteIdea = async (req, res) => {
  try {
    await service.deleteIdea(
      req.params.id,
      req.user.id
    );

    res.json({ msg: 'Idea removed' });
  } catch (err) {
    res.status(err.status || 500).json({
      msg: err.message || 'Server Error'
    });
  }
};