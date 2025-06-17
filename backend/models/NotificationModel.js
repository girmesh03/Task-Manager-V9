import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient user is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      maxlength: [150, "Message cannot exceed 150 characters"],
    },
    type: {
      type: String,
      enum: [
        "TaskAssignment",
        "TaskCompletion",
        "TaskUpdate",
        "StatusChange",
        "SystemAlert",
      ],
      required: [true, "Notification type is required"],
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    linkedDocument: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "linkedDocumentType",
      required: function () {
        return ["TaskAssignment", "TaskUpdate"].includes(this.type);
      },
    },
    linkedDocumentType: {
      type: String,
      enum: ["Task", "User", "Department", "TaskActivity", "RoutineTask"],
      required: function () {
        return !!this.linkedDocument;
      },
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
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

// ===================== Indexes =====================
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days
notificationSchema.index({ linkedDocumentType: 1 });

// ===================== Paginate =====================
notificationSchema.plugin(mongoosePaginate);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
