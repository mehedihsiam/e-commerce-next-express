import morgan from "morgan";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routerV1 from "./src/v1/index.router.js";
import cookieParser from "cookie-parser";
import connectDB from "./src/configs/connectDb.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const PORT = process.env.PORT || 5000;

app.use("/api/v1", routerV1);

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
};

startServer();
