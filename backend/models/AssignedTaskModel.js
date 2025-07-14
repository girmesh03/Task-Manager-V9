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
              const user = await mongoose.model("User").findById(userId);
              return user && user?.department?.equals(this.parent().department);
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

export default Task.discriminator("AssignedTask", assignedTaskSchema);
