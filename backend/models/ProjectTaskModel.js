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
      },
      address: {
        type: String,
        trim: true,
        // required: [true, "Company address is required"],
      },
    },
    proforma: [
      {
        url: {
          type: String,
          required: [true, "Proforma URL is required"],
        },
        public_id: {
          type: String,
          required: [true, "Proforma public_id is required"],
        },
        name: {
          type: String,
          required: [true, "Proforma file name is required"],
        },
        type: {
          type: String,
          enum: ["image", "document", "invoice", "pdf"],
          default: "document",
        },
      },
    ],
  },
  {
    toJSON: Task.schema.options.toJSON,
    toObject: Task.schema.options.toObject,
  }
);

const ProjectTask = Task.discriminator("ProjectTask", projectTaskSchema);

export default ProjectTask;
