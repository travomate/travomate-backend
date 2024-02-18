const express = require("express");
const router = express.Router();
const UserController = require("../controllers/userController");
const {
  validateUserSignUp,
  userValidation,
  validateUserSignIn,
} = require("../../middleware/validation/UserValidation");
const { isAuth, authenticateToken } = require("../../middleware/Auth");
const multer = require('multer');
const flightController = require("../controllers/flightController");
 const User = require("../models/userModel")

// // Set up multer middleware for file uploads

// const storage = multer.diskStorage({});
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    // cb(new Error('Invalid image file!'), false);
    cb("Invalid image file!", false);
  }
};
const uploads = multer({ storage, fileFilter });



 


// GET all users 
router.get("/", UserController.getAllUsers);

// GET a user by ID
router.get("/:id", UserController.getUser);

// POST create a new user (registering a user)
router.post("/", validateUserSignUp, userValidation, UserController.createUser);

// user login
router.post( 
  "/sign-in",
  validateUserSignIn,
  userValidation,
  UserController.userSignIn
);

// user Sign out 
router.post("/sign-out", isAuth, UserController.signOut);

// creating a post for a signed in user
// find a way of adding this to fligcontroller not here
// before creating a post, a user needs to be signed in
router.post("/create-post", isAuth, (req, res) => {
  res.send("welcome you are in secrete route");
});

// for uploading a profile pic
router.post( "/upload-profile", isAuth,uploads.single('profile'),UserController.UploadProfile);

// PUT update a user by ID
router.put("/:id", UserController.updateUser);

// DELETE a user by ID
router.delete("/:id", UserController.deleteUser);

// GET USER PROFILE (DETAILS)


router.get('/user/details', authenticateToken, async (req, res) => {
  try {
      const user = await User.findById(req.userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      const fullName = `${user.firstName} ${user.lastName}`
      res.json({
        success: true,
        Profile: {
          name: fullName,
          email: user.email,
          avatar: user.profilePhoto ? user.profilePhoto : "",
          userId: user._id
        },
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error fetching user details' });
  }
});


//endpoint for bookings request of a particular person
router.post("/booking-request/accept", async (req, res) => {

  const { senderId, recepientId } = req.body;
  try {
    //update the recepient's friendRequestsArray!
    await User.findByIdAndUpdate(senderId, {
      $push: { bookings: recepientId },
    });

    //update the sender's sentFriendRequests array
    await User.findByIdAndUpdate(recepientId, {
      $push: { bookings: senderId },
    });

    res.status(200).json({ message: "booking Request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


//endpoint to access all the bookings of the logged in user! (to be displayed in chat screen)
router.get("/bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "bookings",
      "lastName email profilePhoto"
    ); 
    const bookingList = user.bookings;
    res.json(bookingList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } 
});

//endpoint to get the userDetails to design the chat Room header
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user data from the user ID
    const recepientId = await User.findById(userId);

    res.json(recepientId);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});






module.exports = router;
