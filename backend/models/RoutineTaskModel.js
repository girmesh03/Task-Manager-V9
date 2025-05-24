import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { getFormattedDate } from "../utils/GetDateIntervals.js";

const routineTaskSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Task department is required"],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task performer is required"],
      validate: {
        validator: async function (userId) {
          const user = await mongoose.model("User").findById(userId);
          return user?.department?.equals(this.department);
        },
        message: "Performer must belong to task department",
      },
    },
    date: {
      type: Date,
      required: true,
      default: () => getFormattedDate(new Date(), 0),
      validate: {
        validator: function (date) {
          return date <= getFormattedDate(new Date(), 0); // Prevent future dates
        },
        message: "Log date cannot be in the future",
      },
    },
    performedTasks: [
      {
        description: {
          type: String,
          required: [true, "Task description is required"],
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

routineTaskSchema.plugin(mongoosePaginate);

const RoutineTask = mongoose.model("RoutineTask", routineTaskSchema);

export default RoutineTask;
