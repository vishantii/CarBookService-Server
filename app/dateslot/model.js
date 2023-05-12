const mongoose = require("mongoose");

const slotSchema = mongoose.Schema(
  {
    date: { type: Date, required: true },
    totalSlotsLight: { type: Number, required: true, default: 15 },
    totalSlotsHeavy: { type: Number, required: true, default: 5 },
    reservedSlotsLight: { type: Number, default: 0 },
    reservedSlotsHeavy: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Slot", slotSchema);
