const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  idea: {
    type: Schema.Types.ObjectId,
    ref: 'Idea',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Comment', commentSchema);