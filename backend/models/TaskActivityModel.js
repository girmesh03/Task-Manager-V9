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
      validate: {
        validator: async function (taskId) {
          const session = this.$session();
          const task = await mongoose
            .model("Task")
            .findById(taskId)
            .select("taskType assignedTo createdBy department")
            .session(session);

          if (!task) return false;

          // Validate based on task type
          if (task.taskType === "AssignedTask") {
            return (
              task.assignedTo.some((userId) =>
                userId.equals(this.performedBy)
              ) || task.createdBy.equals(this.performedBy)
            );
          }

          if (task.taskType === "ProjectTask") {
            return task.createdBy.equals(this.performedBy);
          }

          return false;
        },
        message: "User not authorized to log activity for this task",
      },
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
    attachments: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "document", "invoice"],
          default: "image",
        },
        uploadedAt: {
          type: Date,
          default: () => getFormattedDate(new Date(), 0),
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

// ===================== Indexes =====================
taskActivitySchema.index({ task: 1, "statusChange.to": 1 });
taskActivitySchema.index({ performedBy: 1, createdAt: -1 });

taskActivitySchema.plugin(mongoosePaginate);

// ===================== Middleware =====================
taskActivitySchema.pre("save", async function (next) {
  const session = this.$session();

  const task = await mongoose
    .model("Task")
    .findById(this.task)
    .session(session);

  if (this.statusChange) {
    // Auto-populate from status if missing
    if (!this.statusChange.from) {
      this.statusChange.from = task.status;
    }

    if (this.statusChange.from !== task.status) {
      return next(
        new CustomError(
          `Current task status is ${task.status}, cannot transition from ${this.statusChange.from}`,
          400
        )
      );
    }

    // Replace validTransitions with:
    const validTransitions = {
      "To Do": ["In Progress", "Pending"],
      "In Progress": ["In Progress", "Completed", "Pending"],
      Completed: ["Pending", "In Progress"],
      Pending: ["In Progress", "Completed"],
    };

    if (
      !validTransitions[this.statusChange.from]?.includes(this.statusChange.to)
    ) {
      return next(
        new CustomError(
          `Invalid status transition from ${this.statusChange.from} to ${this.statusChange.to}`,
          400
        )
      );
    }

    task.status = this.statusChange.to;
    await task.save({ session });
  }

  next();
});

taskActivitySchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  const task = await mongoose
    .model("Task")
    .findById(this.task)
    .session(session);

  if (task.status === "Completed") {
    return next(
      new CustomError("Cannot delete activities for completed tasks", 400)
    );
  }

  next();
});

const TaskActivity = mongoose.model("TaskActivity", taskActivitySchema);

export default TaskActivity;
