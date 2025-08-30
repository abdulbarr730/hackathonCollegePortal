const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Idea = require('../models/Idea');
const Comment = require('../models/Comment');

// @route   POST api/ideas
// @desc    Create a new idea
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, description, tags } = req.body;
  if (!title || !description) {
    return res.status(400).json({ msg: 'Title and description are required.' });
  }
  try {
    const newIdea = new Idea({
      title,
      description,
      tags: tags || [],
      author: req.user.id,
    });
    const idea = await newIdea.save();
    res.status(201).json(idea);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/ideas
// @desc    Get all ideas
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const ideas = await Idea.find().populate('author', 'name nameWithYear photoUrl').sort({ createdAt: -1 });
    res.json(ideas);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/ideas/:id
// @desc    Get a single idea and its comments
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id).populate('author', 'name nameWithYear photoUrl');
    if (!idea) return res.status(404).json({ msg: 'Idea not found' });

    const comments = await Comment.find({ idea: req.params.id })
      .sort({ createdAt: 'asc' })
      .populate('author', 'name nameWithYear photoUrl');

    res.json({ idea, comments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/ideas/:id/comments
// @desc    Add a comment to an idea
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ msg: 'Comment text is required.' });
    }
    try {
        const newComment = new Comment({
            text,
            author: req.user.id,
            idea: req.params.id
        });
        const comment = await newComment.save();
        const populatedComment = await comment.populate('author', 'name nameWithYear photoUrl');
        res.status(201).json(populatedComment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/ideas/:id
// @desc    Delete an idea
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);

    // Check if the idea exists
    if (!idea) {
      return res.status(404).json({ msg: 'Idea not found' });
    }

    // IMPORTANT: Verify that the user deleting the idea is the author
    if (idea.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await idea.deleteOne();

    res.json({ msg: 'Idea removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;