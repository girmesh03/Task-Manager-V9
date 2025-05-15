import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task ID is required"],
      validate: {
        validator: async function (taskId) {
          const task = await mongoose
            .model("Task")
            .findById(taskId)
            .select("assignedTo createdBy");

          if (!task) return false;

          const isCreator = task.createdBy.equals(this.performedBy);
          const isAssigned = task.assignedTo.some((assignedUserId) =>
            assignedUserId.equals(this.performedBy)
          );

          return isCreator || isAssigned;
        },
        message: "Only creator or assigned users can log activities",
      },
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Performed user ID is required"],
      validate: {
        validator: async function (userId) {
          const user = await mongoose.model("User").findById(userId);
          return user?.isActive && user?.isVerified;
        },
        message: "User must be active and verified",
      },
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
    attachments: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "document", "invoice"],
          default: "image",
        },
      },
    ],
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

// ===================== Middleware =====================
taskActivitySchema.pre("save", async function (next) {
  console.log("taskActivitySchema pre save");
  const session = this.$session();
  const task = await mongoose
    .model("Task")
    .findById(this.task)
    .session(session);

  // Validate and update status change
  if (this.statusChange) {
    if (!this.statusChange.from) {
      return next(new Error("Status change from value is required"));
    }

    if (this.statusChange.from !== task.status) {
      return next(new Error(`Invalid status transition from ${task.status}`));
    }

    const validTransitions = {
      "To Do": ["In Progress", "Pending"],
      "In Progress": ["Completed", "Pending"],
      Completed: ["Pending"],
      Pending: ["In Progress", "Completed"],
    };

    if (
      !validTransitions[this.statusChange.from]?.includes(this.statusChange.to)
    ) {
      return next(new Error("Invalid status transition"));
    }

    task.status = this.statusChange.to;
    await task.save({ session });
  }

  next();
});

// ===================== Indexes =====================
taskActivitySchema.index({ task: 1, "statusChange.to": 1 });
taskActivitySchema.index({ performedBy: 1, createdAt: -1 });

taskActivitySchema.plugin(mongoosePaginate);

// ===================== Middleware =====================
taskActivitySchema.pre("deleteOne", { document: true }, async function (next) {
  // Prevent deletion if task is completed
  const task = await mongoose.model("Task").findById(this.task);

  if (task.status === "Completed") {
    throw new Error("Cannot delete activities for completed tasks");
  }

  next();
});

const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);

export default TaskActivity;
