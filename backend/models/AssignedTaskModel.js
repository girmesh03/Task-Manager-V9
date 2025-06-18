import mongoose from "mongoose";
import Task from "./TaskModel.js";

const assignedTaskSchema = new mongoose.Schema(
  {
    assignedTo: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Assigned user is required"],
          validate: {
            validator: async function (userId) {
              if (!this.parent().department) return false;
              const user = await mongoose
                .model("User")
                .findById(userId)
                .select("department")
                .lean();
              return (
                user?.department?.toString() ===
                this.parent().department.toString()
              );
            },
            message: "User must belong to task department",
          },
        },
      ],
      validate: {
        validator: (users) => users?.length > 0,
        message: "At least one assigned user required",
      },
    },
  },
  {
    toJSON: Task.schema.options.toJSON,
    toObject: Task.schema.options.toObject,
  }
);

// Add index for department-based queries
assignedTaskSchema.index({ department: 1 });

const AssignedTask = Task.discriminator("AssignedTask", assignedTaskSchema);

export default AssignedTask;
