import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import bcrypt from "bcrypt";
import crypto from "crypto";

import { getFormattedDate } from "../utils/GetDateIntervals.js";

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
      required: [true, "Position is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [50, "Email cannot exceed 50 characters"],
      validate: {
        validator: async function (email) {
          const existingUser = await mongoose.model("User").findOne({
            email: email.toLowerCase(),
          });

          return !existingUser || existingUser._id.equals(this._id);
        },
        message: "Email already exists",
      },
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [5, "Password must be at least 5 characters"],
    },
    role: {
      type: String,
      enum: ["SuperAdmin", "Admin", "Manager", "User"], // Consistent naming
      default: "User",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
      validate: {
        validator: async function (departmentId) {
          if (this.role === "SuperAdmin") {
            const department = await mongoose
              .model("Department")
              .findById(departmentId);
            return !!department;
          }
          return true;
        },
        message: "Department must exist for SuperAdmin",
      },
    },
    profilePicture: {
      public_id: String,
      url: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;

        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);

        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;

        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);

        delete ret.id;
        return ret;
      },
    },
  }
);

// ===================== Virtual =====================
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("managedDepartment", {
  ref: "Department",
  localField: "_id",
  foreignField: "managers",
  justOne: true,
});

// ===================== Indexes =====================
userSchema.index({ verificationTokenExpiry: 1 }, { expireAfterSeconds: 900 }); // 15min TTL
userSchema.index({ resetPasswordExpiry: 1 }, { expireAfterSeconds: 3600 }); // 1hr TTL
userSchema.index({ department: 1, role: 1 });

// ===================== Plugins =====================
userSchema.plugin(mongoosePaginate);

// ===================== Middleware =====================
userSchema.pre("save", function (next) {
  const capitalizeName = (name) => {
    return name
      .split(/[\s-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(/[\s-]+/.test(name) ? name.match(/[\s-]+/)[0] : " ");
  };

  if (this.isModified("firstName"))
    this.firstName = capitalizeName(this.firstName);
  if (this.isModified("lastName"))
    this.lastName = capitalizeName(this.lastName);
  if (this.isModified("position")) {
    this.position = this.position
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(new Error("Password hashing failed"));
  }
});

userSchema.pre("validate", async function (next) {
  if (this.role === "SuperAdmin") {
    const existingSuperAdmin = await mongoose.model("User").findOne({
      department: this.department,
      role: "SuperAdmin",
    });
    if (existingSuperAdmin && !existingSuperAdmin._id.equals(this._id)) {
      return next(new Error("Only one SuperAdmin allowed per department"));
    }
  }
  next();
});

// ===================== Methods =====================
userSchema.methods.matchPassword = async function (enteredPassword) {
  const userWithPassword = this.password
    ? this
    : await mongoose.model("User").findById(this._id).select("+password");
  return await bcrypt.compare(enteredPassword, userWithPassword.password);
};

userSchema.methods.generateVerificationToken = function () {
  this.verificationToken = crypto.randomBytes(3).toString("hex").toUpperCase(); // '4D5E6F'
  this.verificationTokenExpiry = getFormattedDate(new Date(), 15); // 15min
};

userSchema.methods.generatePasswordResetToken = function () {
  this.resetPasswordToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordExpiry = getFormattedDate(new Date(), 60); // 1hr
};

const User = mongoose.model("User", userSchema);

export default User;
