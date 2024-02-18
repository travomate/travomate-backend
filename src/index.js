const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const flightRoutes = require("./routes/flightRoute");
const userRoutes = require("./routes/userRoute");
const messageRoutes = require('./routes/messageRoute')
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const port = 8080;

// connect to database

dotenv.config();
 

mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
  })
  .then(() => console.log("database connected successful"))
  .catch((error) => console.log(error));

// using of routes call
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.use("/flights", flightRoutes);
app.use("/users", userRoutes);
app.use("/message", messageRoutes);

app.get("/", (req, res) =>
  res.json({ success: true, message: "welcome to backend APIs" })
); 

app.listen(process.env.PORT || port, () =>
  console.log(`Example App listening on port ${process.env.PORT}!`)
);
