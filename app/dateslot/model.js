const mongoose = require("mongoose");

const slotSchema = mongoose.Schema(
  {
    date: { type: Date, required: true },
    totalSlotsLight: { type: Number, required: true, default: 10 },
    totalSlotsHeavy: { type: Number, required: true, default: 12 },
    reservedSlotsLight: { type: Number, default: 0 },
    reservedSlotsHeavy: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Slot", slotSchema);
