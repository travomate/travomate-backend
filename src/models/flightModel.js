const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    pricePerKg: {
      type: Number,
      required: true,
    },
    numberOfKilos: {
      type: Number,
      required: true,
    },
    from: {
      city: {
        type: String,
        required: true,
      }, 
      flagPhoto: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    to: {
      city: {
        type: String,
        required: true,
      },
      flagPhoto: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    depDate: {
      day: {
        type: String,
        required: true,
      },
      month: {
        type: String,
        required: true,
      },
      year: {
        type: String,
        required: true,
      },
    },
    arrDate: {
      day: {
        type: String,
        required: true,
      },
      month: {
        type: String,
        required: true,
      },
      year: {
        type: String,
        required: true,
      },
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref:'User',
      required: true
    }
  },
  { timestamps: true }
);
const Flight = mongoose.model("Flight", flightSchema);

module.exports = Flight;
