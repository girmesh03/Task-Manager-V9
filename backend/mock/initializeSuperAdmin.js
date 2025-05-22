import Department from "../models/DepartmentModel.js";
import User from "../models/UserModel.js";
import Notification from "../models/NotificationModel.js";
import TaskActivity from "../models/TaskActivityModel.js";
import Task from "../models/TaskModel.js";

const setupSuperAdmin = async () => {
  // 1. Create Default Department
  let department = await Department.findOne({ name: "Engineering" });
  if (!department) {
    department = await Department.create({
      name: "Engineering",
      description: "department of engineering",
      managers: [],
    });
    console.log("Default department created");
  }

  // 2. Create Super Admin
  let superAdmin = await User.findOne({ role: "SuperAdmin" });
  if (!superAdmin) {
    superAdmin = await User.create({
      firstName: process.env.DEFAULT_SUPERADMIN_FIRST_NAME,
      lastName: process.env.DEFAULT_SUPERADMIN_LAST_NAME,
      position: process.env.DEFAULT_SUPERADMIN_POSITION,
      email: process.env.DEFAULT_SUPERADMIN_EMAIL,
      password: process.env.DEFAULT_SUPERADMIN_PASSWORD,
      role: process.env.DEFAULT_SUPERADMIN_ROLE,
      isVerified: true,
      department: department._id,
    });
    console.log("Default Super Admin created");
  }

  // 3. Link Department to Super Admin
  if (!department.managers.includes(superAdmin._id)) {
    department.managers.push(superAdmin._id);
    await department.save();
    console.log("Department linked to Super Admin");
  }
};

const initializeSuperAdmin = async () => {
  try {
    await Notification.deleteMany({});
    await TaskActivity.deleteMany({});
    await Task.deleteMany({});
    await User.deleteMany({});
    await Department.deleteMany({});
    await setupSuperAdmin();
    console.log("Super Admin setup completed");
  } catch (error) {
    console.error("Error setting up Super Admin:", error);
  }
};

export default initializeSuperAdmin;
