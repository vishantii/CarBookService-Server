const mongoose = require("mongoose");

let categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "Nama kategori harus diiisi"],
    },
    price: {
      type: Number,
      require: [true, "Harga harus diiisi"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
