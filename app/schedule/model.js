const mongoose = require("mongoose");

// Define the schema for the availability data
let availabilitySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  times: [
    {
      time: {
        type: String,
        required: true,
      },
      available: {
        type: Boolean,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Schedule", availabilitySchema);
