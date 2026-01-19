const mongoose = require("mongoose");

const MirrorSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "sections/101"
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  synced: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Mirror", MirrorSchema);
