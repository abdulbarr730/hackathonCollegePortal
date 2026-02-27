const express = require('express');
const router = express.Router();
const auth = require('../../core/middlewares/auth');
const Idea = require('./idea.model');
const Comment = require('./comment.model');
const controller = require('./idea.controller');
const commentController = require('./comment.controller');


// @route   POST api/ideas
// @desc    Create a new idea
// @access  Private
router.post('/', auth, controller.createIdea);

// @route   GET api/ideas
// @desc    Get all ideas
// @access  Private
router.get('/', auth, controller.getAllIdeas);

// @route   GET api/ideas/:id
// @desc    Get a single idea and its comments
// @access  Private
router.get('/:id', auth, controller.getIdeaWithComments);

// @route   POST api/ideas/:id/comments
// @desc    Add a comment to an idea
// @access  Private
router.post('/:id/comments', auth, commentController.addComment);

// @route   DELETE api/ideas/:id
// @desc    Delete an idea
// @access  Private
router.delete('/:id', auth, controller.deleteIdea);


module.exports = router;