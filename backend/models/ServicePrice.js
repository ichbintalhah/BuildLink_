const mongoose = require("mongoose");

const servicePriceSchema = new mongoose.Schema({
  category: { type: String, required: true }, // e.g., Renovation
  subCategory: { type: String, required: true }, // e.g., Plumber
  jobName: { type: String, required: true }, // e.g., Install Sink
  fixedPrice: { type: Number, required: true },
});

module.exports = mongoose.model("ServicePrice", servicePriceSchema);
