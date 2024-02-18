const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const sharp = require("sharp");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const accessKey = process.env.S3_Access_Key;
const secreteKey = process.env.S3_Secret_Access_Key;
const regionName = process.env.Bucket_Region;
const bucketName = process.env.Bucket_Name;

// AWS-S3 configurations
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secreteKey,
  },
  region: regionName,
});

// random name
const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

module.exports = {
  createUser: async (req, res) => {
    // checking if email is unique, to prevent duplications
    const { email } = req.body;

    const isNewEmail = await User.isThisEmailInUse(email);

    if (!isNewEmail) {
      return res.json({
        success: false,
        message: "This email is already in use, try sign-in",
      });
    }

    const newUser = new User(req.body);
    try {
      await newUser.save();
      res.json({ success: true, newUser });
      console.log("user created successfully");
    } catch (error) {
      res.status(500).json("Failed to create a user");
      console.log(error);
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.status(200).json({ success: true, userCount: users.length, users });
    } catch (error) {
      res.status(500).json("failed to get users");
    }
  },
  getUser: async (req, res) => {
    try {
      const userId = req.params.id;

      // Find the user by their ID and populate the 'flights' field with flight details
      const user = await User.findById(userId).populate(
        "trips",
        "-createdBy -createdAt -updatedAt"
      );
      // const user = await User.findById(userId)
      
      // If the user is not found, return an error response
      if (!user) {
        return res.status(404).json("User not found");
      }

      res.status(200).json(user);
    } catch (error) {
      res.status(500).json("failed to get user");
      console.log(error)
    }
  },
  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const updatedUser = req.body;
      const user = await User.findByIdAndUpdate(userId, updatedUser, {
        new: true,
      });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json("Failed to update user");
    }
  },

  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      await User.findByIdAndDelete(userId);
      res.status(200).json("User deleted successfully");
    } catch (error) {
      res.status(500).json("Failed to delete user");
    }
  },

  // signing in a user using email and pswd
  userSignIn: async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.json({
        success: false,
        message: "user not found, with the given email!",
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.json({
        success: false,
        message: "email / password does not match!",
      });

    //  give a token to signed in user (using this signed in token to create a private route, )
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // remove an old token if a user want to signOut before the expiration of a token
    let oldTokens = user.tokens || [];

    if (oldTokens.length) {
      oldTokens = oldTokens.filter((t) => {
        const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
        if (timeDiff < 86400) {
          // if it is less 86400(24hrs) in secs
          return t;
        }
      });
    }

    await User.findByIdAndUpdate(user._id, {
      tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
    });

    // when a user is signed in choose which field you to return or return all infos about user like this
    // res.json({success: true, user, token}) here u return full info on user and their token

    // lets return on frontend some user info not all of them from models
    const fullName = `${user.firstName} ${user.lastName}`
    const userInfo = {
      name: fullName,
      email: user.email,
      avatar: user.profilePhoto ? user.profilePhoto : "",
      userId: user._id
    };
    res.json({ success: true, user: userInfo, token });
  },

  UploadProfile: async (req, res) => {
    const { user } = req;
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "unauthorized access!" });

    try {
      const profileBuffer = req.file.buffer;

      const { width, height } = await sharp(profileBuffer).metadata();
      const image = await sharp(profileBuffer)
        .resize(Math.round(width * 0.5), Math.round(height * 0.5))
        .toBuffer();

      const imageName = randomImageName();
      const params = {
        Bucket: bucketName,
        Key: imageName,
        Body: image,
        ContentType: req.file.mimetype,
      };

      const command = new PutObjectCommand(params);
      console.log(command);
      await s3.send(command);

      const imageUrl = `https://${bucketName}.s3.${regionName}.amazonaws.com/${imageName}`;

      // Update user's profile image URL in MongoDB
      await User.findByIdAndUpdate(user._id, { profilePhoto: imageUrl });
      res.status(201).json({
        success: true,
        message: "sent, your profile has updated",
        imageUrl: imageUrl,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "server error, try later" });
      console.log("error while uploading", error.message);
    }
  },

 
  signOut: async (req, res) => {
    if (req.headers && req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Authorization fail!" });
      }

      const tokens = req.user.tokens;

      const newTokens = tokens.filter((t) => t.token !== token);

      await User.findByIdAndUpdate(req.user._id, { tokens: newTokens });
      res.json({ success: true, message: "Sign out successfully!" });
    }
  },
};
