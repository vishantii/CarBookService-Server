const mongoose = require("mongoose");

let sparepartSchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Nama Sparepart harus diiisi"],
    },
    price: {
      type: Number,
      require: [true, "Harga harus diiisi"],
    },
    stock: {
      type: Number,
      require: [true, "Stok harus diiisi"],
    },
    status: {
      type: String,
      enum: ["Y", "N"],
      default: "Y",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sparepart", sparepartSchema);
