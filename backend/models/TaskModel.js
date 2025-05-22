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
          if (this.isNew) return value > now;
          return value > this.createdAt;
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
            .select("department");
          return user?.department?.equals(this.department);
        },
        message: "Creator must belong to the task's department",
      },
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: async function (userId) {
            const user = await mongoose.model("User").findById(userId);
            return user?.department?.equals(this.parent().department);
          },
          message: "Assigned user must belong to task's department",
        },
      },
    ],
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
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
  // Always check for pending status first
  const now = getFormattedDate(new Date(), 0);

  if (this.dueDate <= now && this.status !== "Completed") {
    this.status = "Pending";
    return next();
  }

  if (["Pending", "Completed"].includes(this.status)) return next();

  if (this.status === "To Do") {
    const activities = await mongoose
      .model("TaskActivity")
      .countDocuments({ task: this._id })
      .session(this.$session());

    if (activities > 0) this.status = "In Progress";
  }

  next();
});

// ===================== Cascading Deletes =====================
taskSchema.pre("deleteOne", { document: true }, async function (next) {
  await mongoose.model("TaskActivity").deleteMany({ task: this._id });
  await mongoose.model("Notification").deleteMany({
    $or: [{ task: this._id }, { "linkedDocument.task": this._id }],
  });
  next();
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
