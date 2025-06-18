import mongoose from "mongoose";

const connectionState = {
  isConnected: false,
  retryCount: 0,
  maxRetries: 5,
};

const connectDB = async () => {
  if (connectionState.isConnected) return;

  try {
    await mongoose.connect(process.env.ELILLY_CLOUND_TEST_MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: "majority",
    });

    connectionState.isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    connectionState.retryCount++;

    if (connectionState.retryCount <= connectionState.maxRetries) {
      console.warn(
        `Retrying connection (${connectionState.retryCount}/${connectionState.maxRetries})`
      );
      setTimeout(connectDB, 5000);
    } else {
      console.error("Critical DB connection failure:", error);
      process.exit(1);
    }
  }
};

export default connectDB;
