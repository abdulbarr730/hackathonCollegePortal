const mongoose = require('mongoose');

const AdminConfigSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: mongoose.Schema.Types.Mixed,
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminConfig', AdminConfigSchema);
