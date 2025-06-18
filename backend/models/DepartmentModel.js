import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";
import CustomError from "../errorHandler/CustomError.js";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      // unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
      set: (value) =>
        value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
      set: (value) =>
        value
          .toLowerCase()
          .replace(/(^\w|\.\s*\w)/g, (match) => match.toUpperCase()),
    },
    managers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          validate: {
            validator: async function (userId) {
              const user = await mongoose.model("User").findById(userId).lean();
              return (
                user?.department?.toString() === this._id.toString() &&
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

// Indexes
departmentSchema.index({ managers: 1 });
departmentSchema.index(
  { name: 1 },
  { collation: { locale: "en", strength: 2 } }
);

// Virtuals
departmentSchema.virtual("memberCount", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
  count: true,
});

// Plugins
departmentSchema.plugin(mongoosePaginate);

// Pre-delete Hook
departmentSchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  const departmentId = this._id;

  try {
    // Delete users and their dependencies
    const users = await mongoose
      .model("User")
      .find({ department: departmentId })
      .session(session);

    for (const user of users) {
      await user.deleteOne({ session });
    }

    // Delete tasks
    await mongoose
      .model("Task")
      .deleteMany({ department: departmentId })
      .session(session);

    // Delete routine tasks
    await mongoose
      .model("RoutineTask")
      .deleteMany({ department: departmentId })
      .session(session);

    // Delete notifications
    await mongoose
      .model("Notification")
      .deleteMany({ department: departmentId })
      .session(session);

    next();
  } catch (err) {
    next(new CustomError("Department deletion failed", 500, "DEPT-500"));
  }
});

const Department = mongoose.model("Department", departmentSchema);

export default Department;
