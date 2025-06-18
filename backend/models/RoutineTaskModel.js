import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";
import dayjs from "dayjs";

const routineTaskSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Task department is required"],
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task performer is required"],
      validate: {
        validator: async function (userId) {
          const user = await mongoose.model("User").findById(userId).lean();
          return user?.department?.toString() === this.department.toString();
        },
        message: "Performer must belong to task department",
      },
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
      validate: {
        validator: function (date) {
          return dayjs(date).isSameOrBefore(dayjs(), "day");
        },
        message: "Log date cannot be in the future",
      },
    },
    performedTasks: [
      {
        description: {
          type: String,
          required: [true, "Task description is required"],
          trim: true,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
      },
    ],
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

// Indexes
routineTaskSchema.index({ department: 1, date: -1 });
routineTaskSchema.index({ performedBy: 1, date: -1 });

// Plugins
routineTaskSchema.plugin(mongoosePaginate);

// Pre-delete Hook
routineTaskSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    await mongoose.model("Notification").deleteMany({
      linkedDocument: this._id,
      linkedDocumentType: "RoutineTask",
    });
    next();
  } catch (err) {
    next(err);
  }
});

const RoutineTask = mongoose.model("RoutineTask", routineTaskSchema);

export default RoutineTask;
