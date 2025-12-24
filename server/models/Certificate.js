const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  certId: { type: String, required: true },
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  father: { type: String, required: true },
  mother: { type: String, required: true },
  degree: { type: String, required: true },
  department: { type: String, required: true },
  cgpa: { type: String, required: true },
  session: { type: String, required: true },
  createdAt: { type: String, required: true },
});

module.exports = mongoose.model("Certificate", certificateSchema);
