const mongoose = require('mongoose');

const UpdateRunSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    ok: { type: Boolean, default: false },
    itemsFetched: { type: Number, default: 0 },
    itemsInserted: { type: Number, default: 0 },
    errorMessage: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UpdateRun', UpdateRunSchema);
