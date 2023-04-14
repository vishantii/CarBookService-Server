const mongoose = require("mongoose");

let transactionSchema = mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    category: { type: mongoose.Schema.Types.ObjectId, required: true },
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
    status: {
      type: String,
      enum: ["menunggu_status", "konfirmasi_checkin", "konfirmasi_checkout"],
      default: "menunggu_status",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
