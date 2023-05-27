const mongoose = require("mongoose");

let transactionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    miles: {
      type: Number,
      require: [true, "Kilometer mobil harus diisi"],
    },
    licensePlate: {
      type: String,
      require: [true, "Plat nomor mobil harus diisi"],
    },
    category: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
    },
    cars: {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      make: { type: String, required: true },
      model: { type: String, required: true },
      category: { type: String, required: true },
      year: { type: String, required: true },
    },
    chooseDate: {
      type: String,
      require: [true, "Tanggal servis harus diisi"],
    },
    notes: {
      type: String,
      require: [true, "Keluhan harus diisi"],
    },
    bookingNumber: {
      type: Number,
    },
    timestamp: {
      type: Date,
    },
    queueNumber: {
      type: Number,
    },
    total: {
      type: Number,
    },
    spareparts: [
      {
        sparepartId: { type: mongoose.Schema.Types.ObjectId, ref: "Sparepart" },
        name: { type: String },
        price: { type: Number },
        quantity: { type: Number, required: true, default: 1 },
      },
    ],
    status: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
