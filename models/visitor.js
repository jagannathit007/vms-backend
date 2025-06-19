const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    fields: { type: mongoose.Schema.Types.Mixed, default: null },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("visitor", schema);
