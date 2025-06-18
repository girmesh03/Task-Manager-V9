import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import CustomError from "../errorHandler/CustomError.js";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task reference is required"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed user is required"],
    },
    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    statusChange: {
      from: {
        type: String,
        enum: ["To Do", "In Progress", "Completed", "Pending"],
      },
      to: {
        type: String,
        enum: ["To Do", "In Progress", "Completed", "Pending"],
        required: [true, "Status change is required"],
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);
        delete ret.id;
        return ret;
      },
    },
  }
);

// Indexes
taskActivitySchema.index({ task: 1, "statusChange.to": 1 });
taskActivitySchema.index({ performedBy: 1, createdAt: -1 });

// Plugins
taskActivitySchema.plugin(mongoosePaginate);

// State Transition Logic
taskActivitySchema.pre("save", async function (next) {
  if (!this.statusChange) return next();

  const task = await mongoose.model("Task").findById(this.task);
  if (!task) return next(new CustomError("Task not found", 404, "TASK-404"));

  // Set from status if missing
  if (!this.statusChange.from) {
    this.statusChange.from = task.status;
  }

  // Validate transition
  const validTransitions = {
    "To Do": ["In Progress", "Pending"],
    "In Progress": ["In Progress", "Completed", "Pending"],
    Completed: ["In Progress", "Pending"],
    Pending: ["In Progress", "Completed"],
  };

  if (
    !validTransitions[this.statusChange.from]?.includes(this.statusChange.to)
  ) {
    return next(
      new CustomError(
        `Invalid status transition from ${this.statusChange.from} to ${this.statusChange.to}`,
        400,
        "TASK-400"
      )
    );
  }

  // Update task status
  task.status = this.statusChange.to;
  await task.save();
  next();
});

const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);

export default TaskActivity;
