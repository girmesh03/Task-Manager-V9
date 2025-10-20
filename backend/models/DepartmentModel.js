import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import CustomError from "../errorHandler/CustomError.js";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters"],
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    managers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
      validate: {
        validator: async function (managerIds) {
          const managers = await mongoose.model("User").find({
            _id: { $in: managerIds },
            role: { $in: ["Manager", "Admin", "SuperAdmin"] },
            department: this._id,
          });
          return managers.length === managerIds.length;
        },
        message: "All managers must belong to department with Manager+ role",
      },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.id;
        return ret;
      },
    },
  }
);

// Virtual for member count
departmentSchema.virtual("memberCount", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
  count: true,
});

// Format name/description on save
departmentSchema.pre("save", function (next) {
  const capitalize = (str) =>
    str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

  if (this.isModified("name")) {
    this.name = capitalize(this.name);
  }

  if (this.isModified("description") && this.description) {
    this.description = this.description
      .toLowerCase()
      .replace(/(^\w|\.\s*\w)/g, (match) => match.toUpperCase());
  }

  next();
});

// Prevent deletion if only SuperAdmin exists in department
departmentSchema.pre("deleteOne", { document: true }, async function (next) {
  // Check for SuperAdmins in this department
  const deptSuperAdmins = await mongoose.model("User").countDocuments({
    department: this._id,
    role: "SuperAdmin",
  });

  // Check total SuperAdmins in system
  const totalSuperAdmins = await mongoose.model("User").countDocuments({
    role: "SuperAdmin",
  });

  if (deptSuperAdmins > 0 && totalSuperAdmins === deptSuperAdmins) {
    return next(
      new CustomError(
        "Cannot delete department containing the only SuperAdmin",
        400
      )
    );
  }

  next();
});

// Cascade deletion
departmentSchema.pre("deleteOne", { document: true }, async function (next) {
  const session = this.$session();
  const departmentId = this._id;

  try {
    // 1. Fetch all dependent documents
    const [users, tasks, routineTasks] = await Promise.all([
      mongoose
        .model("User")
        .find({ department: departmentId })
        .session(session),
      mongoose
        .model("Task")
        .find({ department: departmentId })
        .session(session),
      mongoose
        .model("RoutineTask")
        .find({ department: departmentId })
        .session(session),
    ]);

    // 2. Execute parallel deletions
    await Promise.all([
      // Delete users (triggers their pre-delete hooks)
      ...users.map((user) => user.deleteOne({ session })),

      // Delete tasks (triggers task cascade)
      ...tasks.map((task) => task.deleteOne({ session })),

      // Delete routine tasks
      ...routineTasks.map((rt) => rt.deleteOne({ session })),

      // Delete department-specific notifications
      mongoose
        .model("Notification")
        .deleteMany({
          $or: [
            { department: departmentId },
            { "linkedDocument.department": departmentId },
          ],
        })
        .session(session),
    ]);

    next();
  } catch (err) {
    next(new CustomError("Department deletion failed", 500));
  }
});

departmentSchema.plugin(mongoosePaginate);
export default mongoose.model("Department", departmentSchema);
