const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    fields: { type: mongoose.Schema.Types.Mixed, default: null },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    entryTime: { type: Date, default: null },
    exitTime: { type: Date, default: null },
    status: { type: String, enum: ['entered', 'exited'], default: 'entered' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("visitor", schema);