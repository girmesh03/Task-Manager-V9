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
        match: [/^[0-9+\-\s()]+$/, "Invalid phone number format"],
      },
      address: {
        type: String,
        trim: true,
      },
    },
    proforma: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        name: { type: String, required: true },
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

// Add text index for searchable fields
projectTaskSchema.index({
  "companyInfo.name": "text",
  "companyInfo.address": "text",
});

const ProjectTask = Task.discriminator("ProjectTask", projectTaskSchema);

export default ProjectTask;
