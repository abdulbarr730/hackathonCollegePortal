const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  teamName: {
    type: String,
    required: true,
    unique: true,
  },
  leader: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User who is the team leader
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User', // An array of references to all User members
  }],
   problemStatementTitle: {
    type: String,
    default: 'Not yet defined', // Add a default value
  },
  problemStatementDescription: {
    type: String,
    default: 'No description provided yet.', // Add a default value
  },
  pendingRequests: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Team', teamSchema);