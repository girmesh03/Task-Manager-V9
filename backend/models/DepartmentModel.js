import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import Notification from "./NotificationModel.js";
import TaskActivity from "./TaskActivityModel.js";
import Task from "./TaskModel.js";
import User from "./UserModel.js";

import { getFormattedDate } from "../utils/GetDateIntervals.js";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
      set: function (value) {
        return value
          .toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase());
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      set: function (value) {
        return value
          .toLowerCase()
          .replace(/(^\w|\.\s*\w)/g, (match) => match.toUpperCase());
      },
    },
    managers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          validate: {
            validator: async function (userId) {
              const user = await mongoose.model("User").findById(userId);
              return (
                user?.department?.equals(this._id) &&
                ["Manager", "Admin", "SuperAdmin"].includes(user.role)
              );
            },
            message: "User must belong to department and have Manager+ role",
          },
        },
      ],
      default: [],
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
departmentSchema.index({ managers: 1 });

// ===================== Virtuals =====================
departmentSchema.virtual("memberCount", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
  count: true,
});

// ===================== Plugins =====================
departmentSchema.plugin(mongoosePaginate);

// ===================== Middleware Updates =====================
departmentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const session = this.$session();

    try {
      await Notification.deleteMany({
        $or: [
          { department: this._id },
          { "linkedDocument.department": this._id },
        ],
      }).session(session);

      await TaskActivity.deleteMany({ department: this._id }).session(session);
      await Task.deleteMany({ department: this._id }).session(session);
      await User.deleteMany({ department: this._id }).session(session);

      next();
    } catch (err) {
      next(err);
    }
  }
);

// ===================== Static Methods =====================
departmentSchema.statics.findByManager = function (managerId) {
  return this.find({ managers: managerId })
    .populate(
      "managers",
      "firstName lastName email role position profilePicture"
    )
    .lean();
};

const Department = mongoose.model("Department", departmentSchema);

export default Department;
