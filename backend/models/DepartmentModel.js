import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import Notification from "./NotificationModel.js";
import TaskActivity from "./TaskActivityModel.js";
import Task from "./TaskModel.js";
import RoutineTask from "./RoutineTaskModel.js";
import User from "./UserModel.js";
import CustomError from "../errorHandler/CustomError.js";

import { getFormattedDate } from "../utils/GetDateIntervals.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";

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
    const currentUser = this.$currentUser; // Requires passing user context via document
    if (!currentUser || currentUser.role !== "SuperAdmin") {
      return next(
        new CustomError("Only SuperAdmin can delete departments", 403)
      );
    }
    next();
  }
);

// departmentSchema.pre(
//   "deleteOne",
//   { document: true, query: false },
//   async function (next) {
//     const session = this.$session();
//     const departmentId = this._id;

//     try {
//       // Delete all department-related data
//       await Promise.all([
//         Notification.deleteMany({ department: departmentId }).session(session),
//         TaskActivity.deleteMany({ department: departmentId }).session(session),
//         Task.deleteMany({ department: departmentId }).session(session),
//         RoutineTask.deleteMany({ department: departmentId }).session(session),
//         User.deleteMany({ department: departmentId }).session(session),
//       ]);

//       // Delete notifications referencing department-linked documents
//       await Notification.deleteMany({
//         "linkedDocument.department": departmentId,
//       }).session(session);

//       next();
//     } catch (err) {
//       next(err);
//     }
//   }
// );

// ===================== Static Methods =====================

departmentSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    const session = this.$session();
    const departmentId = this._id;

    try {
      // Find all related documents to trigger their individual 'deleteOne' hooks
      const users = await User.find({ department: departmentId }).session(
        session
      );
      for (const user of users) {
        await user.deleteOne({ session });
      }

      const tasks = await Task.find({ department: departmentId }).session(
        session
      );
      for (const task of tasks) {
        await task.deleteOne({ session });
      }

      const routineTasks = await RoutineTask.find({
        department: departmentId,
      }).session(session);
      for (const task of routineTasks) {
        await task.deleteOne({ session }); // Assuming RoutineTask has its own hooks
      }

      // Delete notifications (deleteMany is fine here as they don't have Cloudinary assets)
      await Notification.deleteMany({
        $or: [
          { department: departmentId },
          { "linkedDocument.department": departmentId },
        ],
      }).session(session);

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
