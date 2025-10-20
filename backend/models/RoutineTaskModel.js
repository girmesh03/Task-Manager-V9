import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

const routineTaskSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Task department is required"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task performer is required"],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    performedTasks: [
      {
        description: {
          type: String,
          required: [true, "Routine Task description is required"],
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: [0, "Task progress cannot be less than 0"],
      max: [100, "Task progress cannot exceed 100"],
    },
    attachments: [
      {
        _id: false,
        url: { type: String },
        public_id: { type: String },
        type: {
          type: String,
          enum: ["image", "video", "pdf"],
          default: "image",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
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

// Auto-calculate progress
routineTaskSchema.pre("save", function (next) {
  if (this.isModified("performedTasks")) {
    const total = this.performedTasks.length;
    const completed = this.performedTasks.filter((t) => t.isCompleted).length;
    this.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  }
  next();
});

// Cascade delete attachments and notifications
routineTaskSchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  try {
    // Delete Cloudinary attachments
    if (this.attachments?.length > 0) {
      const publicIds = this.attachments.map((a) => a.public_id);
      await deleteFromCloudinary(publicIds, "raw");
    }

    // Delete notifications
    await mongoose
      .model("Notification")
      .deleteMany({
        linkedDocument: this._id,
        linkedDocumentType: "RoutineTask",
      })
      .session(session);

    next();
  } catch (err) {
    next(err);
  }
});

// Indexes
routineTaskSchema.index({ department: 1, date: -1 });
routineTaskSchema.index({ performedBy: 1, date: -1 });
routineTaskSchema.plugin(mongoosePaginate);

export default mongoose.model("RoutineTask", routineTaskSchema);
