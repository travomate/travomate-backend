const mongoose = require("mongoose");
const Flight = require("../models/flightModel");
const User = require("../models/userModel");

module.exports = {
  // createFlight: async (req, res) => {
  //   res.send('you can create a flight now')
  //   const { userId } = req.params;
  //  console.log(req.params)
  //  const user = await User.findById(userId);
  //  console.log(req.user.flights)

  // },

  // createFlight: async (req, res) => {
  //   try {
  //     // const { pricePerKg, numberOfKilos, from, to, depDate, arrDate, createdBy } = req.body;
  // const {
  //   pricePerKg,
  //   numberOfKilos,
  //   fromCity,
  //   fromFlagPhoto,
  //   fromCountry,
  //   toCity,
  //   toFlagPhoto,
  //   toCountry,
  //   depDay,
  //   depMonth,
  //   depYear,
  //   arrDay,
  //   arrMonth,
  //   arrYear,
  // } = req.body;
  //     // user id
  //     const userId = req.params.id;
  //     console.log("log1 of id: ", userId);
  //     // Step 1: Check if the user who created the flight exists
  //     const user = await User.findById(userId);
  //     if (!user) {
  //       return res.status(404).json({ message: "User not found" });
  //     }
  //     console.log("log2 of a found user: ", user);

  //     //  Step 2: Create the flight
  // const flight = new Flight({
  //   pricePerKg,
  //   numberOfKilos,
  //   from: {
  //     city: fromCity,
  //     flagPhoto: fromFlagPhoto,
  //     country: fromCountry,
  //   },
  //   to: {
  //     city: toCity,
  //     flagPhoto: toFlagPhoto,
  //     country: toCountry,
  //   },
  //   depDate: {
  //     day: depDay,
  //     month: depMonth,
  //     year: depYear,
  //   },
  //   arrDate: {
  //     day: arrDay,
  //     month: arrMonth,
  //     year: arrYear,
  //   },
  //   createdBy: userId,
  // }); // Step 3: Save the flight to the database
  //     await flight.save();
  //     console.log("flight array: ", user.flights);
  //     // Step 4: Add the flight to the user's flights array
  //     user.flights.push(flight._id);
  //     await user.save();
  //     console.log(user);
  //     // Step 5: Return the flight object as the response
  //     res.status(201).json({ flight });
  //   } catch (error) {
  //     console.error("Error while creating flight:", error.message);
  //     res.status(500).json({ message: "Failed to create flight" });
  //   }
  // },
  createFlight: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        pricePerKg,
        numberOfKilos,
        fromCity,
        fromFlagPhoto,
        fromCountry,
        toCity,
        toFlagPhoto,
        toCountry,
        depDay,
        depMonth,
        depYear,
        arrDay,
        arrMonth,
        arrYear,
        createdBy,
      } = req.body; 

      const existingUser = await User.findById(createdBy);
      if (!existingUser) {
        return res
          .status(404)
          .json({ message: "unable to find user by this ID" });
      }

      const flight = new Flight({
        pricePerKg,
        numberOfKilos,
        from: {
          city: fromCity,
          flagPhoto: fromFlagPhoto,
          country: fromCountry,
        },
        to: {
          city: toCity,
          flagPhoto: toFlagPhoto,
          country: toCountry,
        },
        depDate: {
          day: depDay,
          month: depMonth,
          year: depYear,
        },
        arrDate: {
          day: arrDay,
          month: arrMonth,
          year: arrYear,
        },
        createdBy,
      });
      await flight.save({ session });
      // push flight id in the trips array or you can push the actual flight too
      await User.findByIdAndUpdate(createdBy, {
        $push: { trips: flight._id },
      });

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ flight });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(error);
      return res
        .status(500)
        .json({ message: error.message || "Failed to create flight" });
    }
  },

  // getAllFlights: async (req, res) => {
  //   try {
  //     // Find all flights and populate the 'createdBy' field with user details
  //     const flights = await Flight.find().populate(
  //       "createdBy",
  //       "-flights -createdAt -updatedAt"
  //     );
  //     res.status(200).json(flights);
  //   } catch (error) {
  //     res.status(500).json("failed to get flights");
  //   }
  // },
  getAllFlights: async (req, res, next) => {
    let flights;
    try {
      flights = await Flight.find()
        .populate("createdBy", "-trips -createdAt -updatedAt")
        .sort({ createdAt: -1 });
    } catch (error) {
      console.log(error);
    }
    if (!flights) {
      return res.status(404).json({ message: "No flights found" });
    }
    return res.status(200).json({ flightsCount: flights.length, flights });
  },

  getFlight: async (req, res) => {
    try {
      const flightId = req.params.id;

      // Find the flight by its ID and populate the 'createdBy' field with user details
      const flight = await Flight.findById(flightId).populate(
        "createdBy",
        "-trips -createdAt -updatedAt"
      );

      // If the flight is not found, return an error response
      if (!flight) {
        return res.status(404).json("Flight not found");
      }

      res.status(200).json({ flight });
    } catch (error) {
      res.status(500).json("failed to get flight");
    }
  },
  
  deleteFlight: async (req, res) => {
    const flightId = req.params.id;
    let flight;
  
    try {
      flight = await Flight.findByIdAndDelete(flightId);
  
      if (!flight) {
        return res.status(500).json("Failed to delete the flight");
      }
  
      // Remove the flight ID from the user's trips array
      await User.findByIdAndUpdate(flight.createdBy, {
        $pull: { trips: flight._id },
      });
  
      return res.status(200).json("Flight deleted successfully");
    } catch (error) {
      console.log(error);
      return res.status(500).json("Failed to delete the flight");
    }
  },
  
// get all the flights created by a specific user (will be used to display user flight in user's profile)
getFlightByUserId: async (req, res) => {
    const userId = req.params.id
    let userflights;
    try {
      userflights = await User.findById(userId).populate('trips');
    } catch (error) {
      console.log(error); 
    }
    if (!userflights) {
      res.status(500).json("No flight found");
    }
    res.status(200).json({flights: userflights});
  },
};
