const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin performing the action
    action: { type: String, required: true }, // e.g., 'USER_VERIFY', 'USER_ROLE_UPDATE', 'TEAM_DELETE'
    targetType: { type: String, required: true }, // 'User' | 'Team' | 'Idea' | 'Update' | 'Resource'
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }, // any extra info (old/new values, notes, etc.)
  },
  { timestamps: true }
);

// Helpful indexes for filtering/sorting in the admin logs page later
AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ action: 1, targetType: 1 });

module.exports = mongoose.model('AdminLog', AdminLogSchema);
