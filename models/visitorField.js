const mongoose = require("mongoose");

const visitorFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldType: { type: String,enum: ['text', 'number', 'date', 'textarea', 'file'], default: "text" },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  validation: {
    min: { type: Number },
    max: { type: Number }
  }
}, { timestamps: true });


module.exports = mongoose.model("VisitorField", visitorFieldSchema);
