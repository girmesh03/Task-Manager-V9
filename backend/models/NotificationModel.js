import mongoose from "mongoose";

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
      enum: ["TaskAssignment", "TaskCompletion", "StatusUpdate", "SystemAlert"],
      required: true,
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
      type: {
        _id: mongoose.Schema.Types.ObjectId,
        docType: {
          type: String,
          enum: ["Task", "User", "Department", "TaskActivity"],
          required: true,
        },
        department: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    eventDate: {
      type: Date,
      default: () => getFormattedDate(new Date().toISOString(), 0),
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);

        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
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
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, department: 1 });

// ===================== Virtuals =====================
notificationSchema.virtual("formattedEventDate").get(function () {
  return getFormattedDate(this.eventDate);
});

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
