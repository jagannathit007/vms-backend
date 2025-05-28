const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    number: { type: Number, default: "" },
    purpose: { type:String , default:"" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("visitor", schema);
