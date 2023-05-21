const mongoose = require("mongoose");

let carmakeSchema = mongoose.Schema(
  {
    Year: {
      type: String,
      require: [true, "Tahun harus diiisi"],
    },
    objectId: {
      type: String,
      require: [true, "Tahun harus diiisi"],
    },
    Make: {
      type: String,
      require: [true, "Nama Mobil harus diiisi"],
    },
    Model: {
      type: String,
      require: [true, "Model mobil harus diiisi"],
    },
    Category: {
      type: String,
      require: [true, "Nama kategori harus diiisi"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Carmake", carmakeSchema);
