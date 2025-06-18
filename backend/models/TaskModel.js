import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";
import CustomError from "../errorHandler/CustomError.js";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      index: true,
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
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return dayjs(value).isAfter(dayjs().subtract(1, "day"));
        },
        message: "Due date must be in the future",
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
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      index: true,
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

// Virtuals
taskSchema.virtual("activities", {
  ref: "TaskActivity",
  localField: "_id",
  foreignField: "task",
  options: { sort: { createdAt: -1 } },
});

// Indexes
taskSchema.index({ status: 1, department: 1 });
taskSchema.index({ createdBy: 1 });

// Plugins
taskSchema.plugin(mongoosePaginate);

// Pre-delete Hook
taskSchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  const taskId = this._id;

  try {
    // Delete project files if applicable
    if (this.taskType === "ProjectTask" && this.proforma?.length > 0) {
      const publicIds = this.proforma.map((p) => p.public_id).filter(Boolean);
      if (publicIds.length > 0) {
        await deleteFromCloudinary(publicIds);
      }
    }

    // Delete related activities
    await mongoose
      .model("TaskActivity")
      .deleteMany({ task: taskId })
      .session(session);

    // Delete notifications
    await mongoose
      .model("Notification")
      .deleteMany({
        $or: [
          { task: taskId },
          { linkedDocument: taskId, linkedDocumentType: "Task" },
        ],
      })
      .session(session);

    next();
  } catch (err) {
    next(new CustomError("Task deletion failed", 500, "TASK-500"));
  }
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
