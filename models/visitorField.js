const mongoose = require("mongoose");

const visitorFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { type: String, default: "text" },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true }
}, { timestamps: true });

module.exports = mongoose.model("VisitorField", visitorFieldSchema);
