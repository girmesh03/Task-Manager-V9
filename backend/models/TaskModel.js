import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      minlength: [2, "Description must be at least 2 characters"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Completed", "Pending"],
      default: "To Do",
    },
    location: {
      type: String,
      required: [true, "Task location is required"],
      trim: true,
      minlength: [2, "Location must be at least 2 characters"],
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    dueDate: {
      type: Date,
      required: [true, "Task due date is required"],
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task created by is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Task department is required"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
  },
  {
    discriminatorKey: "taskType",
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
  }
);

// Virtual for task activities
taskSchema.virtual("activities", {
  ref: "TaskActivity",
  localField: "_id",
  foreignField: "task",
  options: { sort: { createdAt: -1 } },
});

// Indexes
taskSchema.index({ status: 1, department: 1 });
taskSchema.plugin(mongoosePaginate);

// Auto-update status when activities exist
taskSchema.pre("save", async function (next) {
  if (this.status === "To Do" && this.isModified("status")) {
    const activityCount = await mongoose
      .model("TaskActivity")
      .countDocuments({ task: this._id });
    if (activityCount > 0) this.status = "In Progress";
  }
  next();
});

// Cascade delete
taskSchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  try {
    const activities = await mongoose
      .model("TaskActivity")
      .find({ task: this._id })
      .session(session);

    const activityAttachmentIds = activities.flatMap((activity) =>
      activity.attachments.map((a) => a.public_id)
    );

    if (activityAttachmentIds.length > 0) {
      await deleteFromCloudinary(activityAttachmentIds, "raw");
    }

    await Promise.all([
      mongoose
        .model("TaskActivity")
        .deleteMany({ task: this._id })
        .session(session),
      mongoose
        .model("Notification")
        .deleteMany({
          $or: [
            { task: this._id },
            { linkedDocument: this._id, linkedDocumentType: "Task" },
          ],
        })
        .session(session),
    ]);

    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Task", taskSchema);
