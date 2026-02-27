const express = require('express');
const router = express.Router();
const auth = require('../../core/middlewares/auth');
const Comment = require('./comment.model'); // Assuming you have a Comment model
const controller = require('./comment.controller');

// @route   DELETE api/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/:id', auth, controller.deleteComment);

module.exports = router;