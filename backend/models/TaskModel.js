import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { customDayjs } from "../utils/GetDateIntervals.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

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
          const due = customDayjs(value);
          const now = customDayjs();

          if (this.isNew) {
            // For new documents: due date must be in future
            if (!due.isAfter(now)) {
              throw new Error("Due date must be in the future.");
            }
          } else {
            // For existing documents: due date must be after createdAt
            if (!due.isSameOrAfter(this.createdAt)) {
              throw new Error(
                "Due date must be on or after task creation date."
              );
            }
          }
          return true;
        },
        message: function (props) {
          return props.reason.message; // Forward thrown error message
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
          const user = await mongoose.model("User").findById(userId);
          return user?.department?.equals(this.department);
        },
        message: "Creator must belong to task department",
      },
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
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

// Virtual for task activities (reverse populate)
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

// Cascade delete notifications
taskSchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  try {
    // 1. Fetch all related TaskActivities
    const activities = await mongoose
      .model("TaskActivity")
      .find({ task: this._id })
      .session(session);

    // 2. Delete Cloudinary attachments from TaskActivities
    const activityAttachmentIds = activities.flatMap((activity) =>
      activity.attachments.map((a) => a.public_id)
    );

    if (activityAttachmentIds.length > 0) {
      await deleteFromCloudinary(activityAttachmentIds, "raw");
    }

    // 3. Bulk delete TaskActivities and their notifications
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
    next(new CustomError("Task deletion failed", 500));
  }
});

export default mongoose.model("Task", taskSchema);
