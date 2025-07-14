import bcrypt from "bcrypt";
import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Task from "../models/TaskModel.js"; // base model for assigned and project task
import TaskActivity from "../models/TaskActivityModel.js";
import RoutineTask from "../models/RoutineTaskModel.js";
import Notification from "../models/NotificationModel.js";

const createDefaultDepartment = async () => {
  try {
    let department = await Department.findOne({ name: "Engineering" });

    if (!department) {
      console.log("Default 'Engineering' department not found. Creating...");
      // Using insertMany within an array is generally preferred even for single documents
      // as it aligns better with session/transaction usage if this were part of a larger batch.
      const departments = await Department.insertMany([
        {
          name: "Engineering",
          description: "Default department for initial setup.",
          managers: [], // Start with no managers linked directly
        },
      ]);
      department = departments[0];
      console.log("Default 'Engineering' department created successfully.");
    } else {
      console.log("'Engineering' department already exists.");
    }
    return department;
  } catch (error) {
    console.error("Error creating default department:", error);
    return null; // Indicate failure
  }
};

const createDefaultSuperAdmin = async (defaultDepartment) => {
  if (!defaultDepartment) {
    console.error("Cannot create Super Admin: Default department is missing.");
    return null;
  }

  // Check required environment variables for Super Admin details
  const requiredEnv = [
    "DEFAULT_SUPERADMIN_FIRST_NAME",
    "DEFAULT_SUPERADMIN_LAST_NAME",
    "DEFAULT_SUPERADMIN_POSITION",
    "DEFAULT_SUPERADMIN_ROLE",
    "DEFAULT_SUPERADMIN_EMAIL",
    "DEFAULT_SUPERADMIN_PASSWORD", // Note: This will be hashed below
  ];
  const missingEnv = requiredEnv.filter((envVar) => !process.env[envVar]);

  if (missingEnv.length > 0) {
    console.error(
      `Missing required environment variables for Super Admin setup: ${missingEnv.join(
        ", "
      )}`
    );
    console.warn(
      "Super Admin creation skipped due to missing environment variables."
    );
    return null; // Skip setup if env vars are missing
  }

  // Find if a SuperAdmin already exists (checking globally or per department based on model validation logic)
  // Assuming model validation enforces the 'per company' rule from original code.
  let superAdmin = await User.findOne({
    // department: defaultDepartment._id, // If using per department validation
    role: "SuperAdmin", // Use the specific role string
  });

  if (!superAdmin) {
    console.log("Default Super Admin not found. Creating...");
    try {
      // HASH PASSWORD WITH BCRYPT (SALT ROUNDS: 12)
      const hashedPassword = await bcrypt.hash(
        process.env.DEFAULT_SUPERADMIN_PASSWORD,
        12
      );

      // User.create handles other fields but we've manually handled password hashing
      const users = await User.insertMany([
        {
          firstName: process.env.DEFAULT_SUPERADMIN_FIRST_NAME,
          lastName: process.env.DEFAULT_SUPERADMIN_LAST_NAME,
          position: process.env.DEFAULT_SUPERADMIN_POSITION,
          email: process.env.DEFAULT_SUPERADMIN_EMAIL,
          password: hashedPassword, // Use hashed password instead of plaintext
          role: process.env.DEFAULT_SUPERADMIN_ROLE,
          isVerified: true, // Mark SuperAdmin as verified by default
          isActive: true, // Mark SuperAdmin as active by default
          department: defaultDepartment._id, // Assign to the default department
        },
      ]);
      superAdmin = users[0];
      console.log(
        `Default Super Admin created successfully with email: ${superAdmin.email}`
      );
    } catch (error) {
      console.error("Error creating default Super Admin:", error);
      // Handle specific Mongoose errors (like duplicate key) if necessary
      if (error.code === 11000) {
        console.error(
          `Error: Email '${process.env.DEFAULT_SUPERADMIN_EMAIL}' for default Super Admin likely already exists.`
        );
      }
      return null; // Stop if Super Admin creation fails
    }
  } else {
    console.log(
      `Super Admin user already exists with email: ${superAdmin.email}`
    );
    // If Super Admin exists, ensure their department is correct and they are a manager
    if (
      !superAdmin.department ||
      !superAdmin.department.equals(defaultDepartment._id)
    ) {
      superAdmin.department = defaultDepartment._id;
      await superAdmin.save(); // Save changes
      console.log("Existing Super Admin department updated.");
    }
  }

  // Link the default department to the Super Admin as manager if not already
  if (
    superAdmin &&
    defaultDepartment &&
    !defaultDepartment.managers.includes(superAdmin._id)
  ) {
    try {
      defaultDepartment.managers.push(superAdmin._id);
      await defaultDepartment.save(); // Save changes to the department
      console.log("Default department linked to Super Admin as manager.");
    } catch (error) {
      console.error("Error linking department to Super Admin:", error);
    }
  } else if (superAdmin && defaultDepartment) {
    console.log(
      "Default department is already linked to Super Admin as manager."
    );
  }

  return superAdmin;
};

/**
 * Clears specified collections if the CLEAR_DATABASE_ON_START environment variable is 'true'.
 * Relies on model hooks for cascading deletes (e.g., Cloudinary cleanup).
 */
const clearDatabase = async () => {
  // CRITICAL: Only run deletion if explicitly enabled via environment variable
  if (process.env.CLEAR_DATABASE_ON_START === "true") {
    console.warn(
      "CLEAR_DATABASE_ON_START is enabled. Deleting existing data..."
    );
    try {
      // Order of deletion matters if relying on hooks:
      // 1. Delete users - triggers profile picture cleanup, may trigger task/activity cleanup if hooks are designed that way.
      // 2. Delete departments - triggers user/task/routineTask cleanup via hooks if designed.
      // 3. Delete Tasks (base) - triggers ProjectTask proforma cleanup and TaskActivity cleanup via hooks.
      // 4. Delete RoutineTasks - triggers Notification cleanup via hooks.
      // 5. Delete TaskActivities - triggers Notification cleanup via hooks.
      // 6. Delete Notifications - no cascading dependencies.

      // To ensure hooks run, retrieve documents and call deleteOne.
      // This is less performant than deleteMany, but necessary for hooks.

      console.log("Deleting all Departments...");
      const departments = await Department.find({});
      for (const dept of departments) {
        await dept.deleteOne(); // Calls the pre('deleteOne') hook
      }
      console.log("Departments deletion complete.");

      console.log("Deleting all Users...");
      const users = await User.find({});
      for (const user of users) {
        await user.deleteOne(); // Calls the pre('deleteOne') hook (profile pic cleanup)
      }
      console.log("Users deletion complete.");

      console.log("Deleting all Tasks (including Assigned/Project)...");
      const tasks = await Task.find({});
      for (const task of tasks) {
        await task.deleteOne(); // Calls the pre('deleteOne') hook (proforma, activities, notifications)
      }
      console.log("Tasks deletion complete.");

      console.log("Deleting all Routine Tasks...");
      // Assuming RoutineTask delete hook only handles notifications, deleteMany is fine here
      await RoutineTask.deleteMany({});
      console.log("Routine Tasks deletion complete.");

      console.log("Deleting all Task Activities...");
      // Assuming TaskActivity delete hook only handles notifications, deleteMany is fine here
      await TaskActivity.deleteMany({});
      console.log("Task Activities deletion complete.");

      console.log("Deleting all Notifications...");
      await Notification.deleteMany({});
      console.log("Notifications deletion complete.");

      console.warn("Existing data deletion completed successfully.");
    } catch (error) {
      console.error("Error during database clearing:", error);
      // Decide if failure here should prevent server startup.
      // For now, log and allow the app to proceed, but data might be inconsistent.
    }
  } else {
    console.log(
      "CLEAR_DATABASE_ON_START is not 'true'. Skipping data deletion."
    );
  }
};

/**
 * Main database initialization function.
 * Runs optional data clearing and creates essential initial data (department, SuperAdmin).
 */
const initializeDatabase = async () => {
  console.log("Starting database initialization...");
  try {
    // 1. Optionally clear existing data based on environment variable
    await clearDatabase();

    // 2. Ensure the default department exists
    const defaultDepartment = await createDefaultDepartment();
    if (!defaultDepartment) {
      console.error(
        "Database initialization failed: Could not create or find default department."
      );
      // If department creation fails, we cannot create the Super Admin.
      // Consider a more critical error/exit here depending on app requirements.
      return;
    }

    // 3. Ensure the default Super Admin exists and is linked to the department
    await createDefaultSuperAdmin(defaultDepartment); // Pass the department document

    console.log("Database initialization completed.");
  } catch (error) {
    console.error("Error during database initialization:", error);
    // Generic catch for errors not handled in specific helper functions.
    // Decide if this should halt startup.
  }
};

export default initializeDatabase; // Export the main initialization function
