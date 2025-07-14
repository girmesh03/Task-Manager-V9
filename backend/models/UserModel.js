import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {customDayjs} from "../utils/GetDateIntervals.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";
import CustomError from "../errorHandler/CustomError.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "User Position is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 50,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
      validate: {
        validator: async function (email) {
          const user = await this.constructor.findOne({ email });
          return !user || user._id.equals(this._id);
        },
        message: "Email already exists",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Manager", "User"],
      default: "User",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "User Department Id is required"],
    },
    profilePicture: {
      url: String,
      public_id: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    pendingEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    emailChangeToken: { type: String, select: false },
    emailChangeTokenExpiry: { type: Date, select: false },
    verificationToken: { type: String, select: false },
    verificationTokenExpiry: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date, select: false },
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

// Format name fields on save
userSchema.pre("save", function (next) {
  const capitalize = (str) =>
    str.trim().replace(/\b\w/g, (char) => char.toUpperCase());

  if (this.isModified("firstName")) {
    this.firstName = capitalize(this.firstName);
  }

  if (this.isModified("lastName")) {
    this.lastName = capitalize(this.lastName);
  }

  if (this.isModified("position")) {
    this.position = capitalize(this.position);
  }

  next();
});

// Global SuperAdmin uniqueness
userSchema.pre("validate", async function (next) {
  if (this.role === "SuperAdmin") {
    const existing = await this.constructor.findOne({
      role: "SuperAdmin",
      _id: { $ne: this._id },
    });

    if (existing) {
      return next(
        new CustomError("Only one SuperAdmin allowed per company", 400)
      );
    }
  }
  next();
});

// Password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.tokenVersion += 1;
    next();
  } catch (error) {
    next(new CustomError("Password hashing failed", 500));
  }
});

// Prevent deletion if user has task associations
userSchema.pre("deleteOne", { document: true }, async function (next) {
  const [createdTasks, assignedTasks, routineTasks] = await Promise.all([
    mongoose.model("Task").countDocuments({ createdBy: this._id }),
    mongoose.model("AssignedTask").countDocuments({ assignedTo: this._id }),
    mongoose.model("RoutineTask").countDocuments({ performedBy: this._id }),
  ]);

  if (createdTasks > 0 || assignedTasks > 0 || routineTasks > 0) {
    return next(
      new CustomError("Cannot delete user with associated tasks", 400)
    );
  }
  next();
});

// Delete profile picture from Cloudinary
userSchema.pre("deleteOne", { document: true }, async function (next) {
  if (this?.profilePicture?.public_id) {
    try {
      await deleteFromCloudinary(this.profilePicture.public_id, "image");
    } catch (err) {
      return next(new CustomError("Profile picture deletion failed", 500));
    }
  }
  next();
});

// Virtuals
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("managedDepartment", {
  ref: "Department",
  localField: "_id",
  foreignField: "managers",
  // justOne: true, // it will become null instead of array
});

// Indexes
userSchema.index({ verificationTokenExpiry: 1 }, { expireAfterSeconds: 900 });
userSchema.index({ emailChangeTokenExpiry: 1 }, { expireAfterSeconds: 900 });
userSchema.index({ resetPasswordExpiry: 1 }, { expireAfterSeconds: 3600 });
userSchema.plugin(mongoosePaginate);

// Password comparison method
userSchema.methods.matchPassword = async function (enteredPassword) {
  const user = await this.constructor.findById(this._id).select("+password");
  return bcrypt.compare(enteredPassword, user.password);
};

// Verification token
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(3).toString("hex").toUpperCase();
  this.verificationToken = token;

  this.verificationTokenExpiry = customDayjs()
    .utc(true)
    .add(15, "minutes")
    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
  return { token, expiry: this.verificationTokenExpiry };
};

// Password  reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = token;
  this.resetPasswordExpiry = customDayjs()
    .utc(true)
    .add(1, "hour")
    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
  return { token, expiry: this.resetPasswordExpiry };
};

export default mongoose.model("User", userSchema);
