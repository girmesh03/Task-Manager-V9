// backend/config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // await mongoose.connect(process.env.ELILLY_CLOUND_MONGODB_URI);
    await mongoose.connect(process.env.ELILLY_CLOUND_TEST_MONGODB_URI);
    // await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

export default connectDB;
