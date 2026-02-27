const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ideaSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: [{ // e.g., ['AI/ML', 'Blockchain', 'Healthcare']
    type: String,
  }],
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // We can add upvotes or other features later
}, {
  timestamps: true,
});

module.exports = mongoose.model('Idea', ideaSchema);