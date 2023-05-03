const mongoose = require("mongoose");

let transactionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    carBrand: {
      type: String,
      require: [true, "Merk mobil harus diisi"],
    },
    carType: {
      type: String,
      require: [true, "Tipe mobil harus diisi"],
    },
    carYear: {
      type: Number,
      require: [true, "Tahun mobil harus diisi"],
    },
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
      price: { type: String, required: true },
    },
    chooseDate: {
      type: String,
      require: [true, "Tanggal servis harus diisi"],
    },
    chooseTime: {
      type: String,
      require: [true, "Jam servis harus diisi"],
    },
    notes: {
      type: String,
      require: [true, "Keluhan harus diisi"],
    },
    bookingNumber: {
      type: Number,
    },
    total: {
      type: Number,
    },
    spareparts: [
      {
        sparepartId: { type: mongoose.Schema.Types.ObjectId, ref: "Sparepart" },
        name: { type: String },
        price: { type: String },
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
