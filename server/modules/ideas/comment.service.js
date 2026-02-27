const Comment = require('./comment.model');

/* ============================================================================
   ADD COMMENT TO IDEA
============================================================================ */
exports.addComment = async (ideaId, text, userId) => {

  if (!text) {
    const err = new Error('Comment text is required.');
    err.status = 400;
    throw err;
  }

  const newComment = new Comment({
    text,
    author: userId,
    idea: ideaId
  });

  const saved = await newComment.save();

  const populated = await saved.populate(
    'author',
    'name nameWithYear photoUrl'
  );

  return populated;
};

/* ============================================================================
   DELETE COMMENT
============================================================================ */
exports.deleteComment = async (commentId, userId) => {

  const comment = await Comment.findById(commentId);

  if (!comment) {
    const err = new Error('Comment not found');
    err.status = 404;
    throw err;
  }

  if (comment.author.toString() !== userId) {
    const err = new Error('User not authorized');
    err.status = 401;
    throw err;
  }

  await comment.deleteOne();

  return true;
};