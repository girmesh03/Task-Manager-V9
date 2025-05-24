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
              const user = await mongoose
                .model("User")
                .findById(userId)
                .select("department")
                .session(this.$session());
              // validate if the user department is the same as the task
              // since the task is parent.
              return user?.department?.equals(this.parent().department);
            },
            message: "User must belong to task department",
          },
        },
      ],
      validate: {
        validator: function (users) {
          return users.length > 0;
        },
        message: "At least one assigned user required",
      },
    },
  },
  {
    toJSON: Task.schema.options.toJSON,
    toObject: Task.schema.options.toObject,
  }
);

const AssignedTask = Task.discriminator("AssignedTask", assignedTaskSchema);

export default AssignedTask;
