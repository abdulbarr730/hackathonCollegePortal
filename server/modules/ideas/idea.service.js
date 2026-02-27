const Idea = require('./idea.model');
const Comment = require('./comment.model');

/* ============================================================================
   CREATE IDEA
============================================================================ */
exports.createIdea = async (body, userId) => {

  const { title, description, tags } = body;

  if (!title || !description) {
    const err = new Error('Title and description are required.');
    err.status = 400;
    throw err;
  }

  const newIdea = new Idea({
    title,
    description,
    tags: tags || [],
    author: userId,
  });

  const saved = await newIdea.save();

  return saved;
};

/* ============================================================================
   GET ALL IDEAS
============================================================================ */
exports.getAllIdeas = async () => {

  const ideas = await Idea.find()
    .populate('author', 'name nameWithYear photoUrl')
    .sort({ createdAt: -1 });

  return ideas;
};

/* ============================================================================
   GET SINGLE IDEA WITH COMMENTS
============================================================================ */
exports.getIdeaWithComments = async (ideaId) => {

  const idea = await Idea.findById(ideaId)
    .populate('author', 'name nameWithYear photoUrl');

  if (!idea) {
    const err = new Error('Idea not found');
    err.status = 404;
    throw err;
  }

  const comments = await Comment.find({ idea: ideaId })
    .sort({ createdAt: 'asc' })
    .populate('author', 'name nameWithYear photoUrl');

  return { idea, comments };
};

/* ============================================================================
   DELETE IDEA
============================================================================ */
exports.deleteIdea = async (ideaId, userId) => {

  const idea = await Idea.findById(ideaId);

  if (!idea) {
    const err = new Error('Idea not found');
    err.status = 404;
    throw err;
  }

  if (idea.author.toString() !== userId) {
    const err = new Error('User not authorized');
    err.status = 401;
    throw err;
  }

  await idea.deleteOne();

  return true;
};