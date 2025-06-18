import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getFormattedDate } from "../utils/GetDateIntervals.js";
import { deleteFromCloudinary } from "../utils/cloudinaryHelper.js";
import CustomError from "../errorHandler/CustomError.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      set: (value) => value.replace(/\b\w/g, (char) => char.toUpperCase()),
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      set: (value) => value.replace(/\b\w/g, (char) => char.toUpperCase()),
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      set: (value) =>
        value
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      // unique: true,
      lowercase: true,
      trim: true,
      maxlength: [50, "Email cannot exceed 50 characters"],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email format",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
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
      required: [true, "Department is required"],
      index: true,
    },
    profilePicture: {
      public_id: String,
      url: String,
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
    emailChangeToken: String,
    emailChangeTokenExpiry: Date,
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
      transform: function (doc, ret) {
        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiry;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpiry;
        delete ret.id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.createdAt = getFormattedDate(ret.createdAt, 0);
        ret.updatedAt = getFormattedDate(ret.updatedAt, 0);
        delete ret.password;
        delete ret.verificationToken;
        delete ret.verificationTokenExpiry;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpiry;
        delete ret.id;
        return ret;
      },
    },
  }
);

// Virtuals
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("managedDepartment", {
  ref: "Department",
  localField: "_id",
  foreignField: "managers",
  justOne: true,
});

// Indexes
userSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);
userSchema.index({ department: 1, role: 1 });

// Plugins
userSchema.plugin(mongoosePaginate);

// ===================== Middleware =====================

// Capitalize firstName, lastName and position
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

// Password Hashing Middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(new CustomError("Password hashing failed", 500, "AUTH-500"));
  }
});

// SuperAdmin Validation Middleware
userSchema.pre("save", async function (next) {
  if ((this.isNew || this.isModified("role")) && this.role === "SuperAdmin") {
    const existingSA = await mongoose.model("User").findOne({
      department: this.department,
      role: "SuperAdmin",
    });

    if (existingSA) {
      return next(
        new CustomError(
          "Only one SuperAdmin allowed per department",
          400,
          "USER-400"
        )
      );
    }
  }
  next();
});

// Profile Picture Deletion Helper
const deleteProfilePicture = async (doc) => {
  if (doc?.profilePicture?.public_id) {
    try {
      await deleteFromCloudinary(doc.profilePicture.public_id);
    } catch (err) {
      console.error("Profile picture deletion failed:", err);
    }
  }
};

// Document Deletion Middleware
userSchema.pre("deleteOne", { document: true }, async function (next) {
  await deleteProfilePicture(this);
  next();
});

// Query Deletion Middleware
userSchema.pre("deleteOne", { query: true }, async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  await deleteProfilePicture(doc);
  next();
});

// FindOneAndDelete Middleware
userSchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  await deleteProfilePicture(doc);
  next();
});

// Authentication Methods
userSchema.methods.matchPassword = async function (enteredPassword) {
  const user = await mongoose
    .model("User")
    .findById(this._id)
    .select("+password");
  return await bcrypt.compare(enteredPassword, user.password);
};

// Token Generation Methods
userSchema.methods.generateVerificationToken = function () {
  const token = crypto.randomBytes(6).toString("hex").toUpperCase();
  this.verificationToken = token;
  this.verificationTokenExpiry = getFormattedDate(new Date(), 15);
  return token;
};

// Password Reset Token Generation
userSchema.methods.generatePasswordResetToken = function () {
  this.resetPasswordToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordExpiry = getFormattedDate(dayjs().format("YYYY-MM-DD"), 60); // 1hr
};

const User = mongoose.model("User", userSchema);

export default User;
