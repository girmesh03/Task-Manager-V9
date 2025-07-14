import mongoose from "mongoose";
import Task from "./TaskModel.js";

const projectTaskSchema = new mongoose.Schema(
  {
    companyInfo: {
      name: {
        type: String,
        required: [true, "Company name is required"],
        trim: true,
      },
      phoneNumber: {
        type: String,
        required: [true, "Company phone number is required"],
        trim: true,
        minlength: [10, "Phone number must be at least 10 characters"],
        maxlength: [13, "Phone number cannot exceed 13 characters"],
        match: [/^\+?[0-9\s]{10,13}$/, "Invalid phone number"],
      },
      address: {
        type: String,
        trim: true,
      },
    },
  },
  {
    toJSON: Task.schema.options.toJSON,
    toObject: Task.schema.options.toObject,
  }
);

export default Task.discriminator("ProjectTask", projectTaskSchema);
