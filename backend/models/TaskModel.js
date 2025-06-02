import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Completed", "Pending"],
      default: "To Do",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          const now = getFormattedDate(new Date(), 0);
          const formattedDueDate = getFormattedDate(new Date(value), 0);

          if (this.isNew) return formattedDueDate > now;
          return (
            formattedDueDate > getFormattedDate(new Date(this.createdAt), 0)
          );
        },
        message: function () {
          return this?.isNew
            ? "Due date must be in the future"
            : "Due date must be after creation date";
        },
      },
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: async function (userId) {
          const user = await mongoose
            .model("User")
            .findById(userId)
            .select("department")
            .session(this.$session());
          return user?.department?.equals(this.department);
        },
        message: "Creator must belong to the task's department",
      },
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
  },
  {
    discriminatorKey: "taskType",
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

// ===================== Virtuals & Indexes =====================
taskSchema.virtual("activities", {
  ref: "TaskActivity",
  localField: "_id",
  foreignField: "task",
  options: { sort: { createdAt: -1 } },
});

taskSchema.index({ status: 1, department: 1 });
taskSchema.index({ createdBy: 1 });

// ===================== Plugins =====================
taskSchema.plugin(mongoosePaginate);

// ===================== Auto-Status Updates =====================
taskSchema.pre("save", async function (next) {
  const session = this.$session();
  const now = getFormattedDate(new Date(), 0);

  if (getFormattedDate(this.dueDate, 0) <= now && this.status !== "Completed") {
    this.status = "Pending";
    return next();
  }

  if (["Pending", "Completed"].includes(this.status)) return next();

  if (this.status === "To Do") {
    const query = mongoose
      .model("TaskActivity")
      .countDocuments({ task: this._id })
      .setOptions({ session });

    const activities = await query;
    if (activities > 0) this.status = "In Progress";
  }

  next();
});

// ===================== Middleware =====================
taskSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      const taskId = this._id;
      const session = this.$session();

      await Promise.all([
        // Delete related task activities
        mongoose
          .model("TaskActivity")
          .deleteMany({ task: taskId })
          .setOptions({ session }),

        // Delete notifications referencing the task
        mongoose
          .model("Notification")
          .deleteMany({
            $or: [
              { task: taskId }, // Direct task reference
              {
                linkedDocument: taskId,
                linkedDocumentType: "Task", // Reference through linkedDocument
              },
            ],
          })
          .setOptions({ session }),
      ]);

      next();
    } catch (err) {
      next(err);
    }
  }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
