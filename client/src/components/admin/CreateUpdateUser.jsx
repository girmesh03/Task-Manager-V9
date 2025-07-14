import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import InputAdornment from "@mui/material/InputAdornment";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../../redux/features/authSlice";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../redux/features/userApiSlice";
import { useGetAllDepartmentsQuery } from "../../redux/features/departmentApiSlice";

import MuiTextField from "../MuiTextField";
import DropdownMenu from "../DropdownMenu";
import MuiAutocomplete from "../MuiAutocomplete";
import MuiFormDialog from "../MuiFormDialog";
import { LoadingFallback } from "../LoadingFallback";

import {
  userRoleTypes,
  userActiveTypes,
  userVerifiedTypes,
} from "../../utils/constants";

const CreateUpdateUser = ({ open, handleClose, title, selectedUser }) => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const [showPassword, setShowPassword] = useState(false);
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const {
    data = {},
    isLoading,
    isError,
    error,
  } = useGetAllDepartmentsQuery(
    { page: 1, limit: 100 },
    {
      skip: selectedUser,
    }
  );

  const { departments = [] } = data;

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      department: "",
      firstName: "",
      lastName: "",
      position: "",
      email: "",
      password: "",
      role: "User",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (formData) => {
    try {
      let response;
      if (selectedUser) {
        response = await updateUser({
          departmentId,
          userId: selectedUser._id,
          userData: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            position: formData.position,
            role: formData.role,
            isActive: formData.isActive === "Active" ? true : false,
            isVerified: formData.isVerified === "Verified" ? true : false,
          },
        }).unwrap();
      } else {
        response = await createUser({
          departmentId: formData.department,
          userData: formData,
        }).unwrap();
      }

      toast.success(response.message);
      reset();
      handleClose();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  useEffect(() => {
    if (selectedUser) {
      reset({
        ...selectedUser,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        position: selectedUser.position,
        role: selectedUser.role,
        isVerified: selectedUser.isVerified ? "Verified" : "Not Verified",
        isActive: selectedUser.isActive ? "Active" : "Inactive",
      });
    }
  }, [selectedUser, reset]);

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <MuiFormDialog
      title={title}
      open={open}
      handleClose={handleClose}
      handleSubmit={() => handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      {isLoading ? (
        <LoadingFallback height="50vh" />
      ) : (
        <Grid container spacing={2} sx={{ my: 2 }}>
          {/* Department */}
          {!selectedUser && (
            <Grid size={{ xs: 12 }}>
              <Stack direction="column" justifyContent="center" spacing={1}>
                <Typography variant="body1" sx={{ color: "text.secondary" }}>
                  Department
                </Typography>
                <MuiAutocomplete
                  name="department"
                  control={control}
                  options={departments?.map((dept) => {
                    return {
                      ...dept,
                      firstName: dept.name,
                    };
                  })}
                  // multiple={false}
                  rules={{
                    required: "User department is required",
                    validate: (value) => {
                      if (value.length > 1) {
                        return "Select only one department";
                      }
                      return true;
                    },
                  }}
                  fullWidth
                />
              </Stack>
            </Grid>
          )}

          {/* First Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="firstName">FirstName</FormLabel>
              <MuiTextField
                name="firstName"
                control={control}
                rules={{ required: "First name is required" }}
                placeholder="Eg. John"
              />
            </FormControl>
          </Grid>

          {/* Last Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="lastName">Last Name</FormLabel>
              <MuiTextField
                name="lastName"
                control={control}
                rules={{ required: "Last name is required" }}
                placeholder="Eg. Doe"
              />
            </FormControl>
          </Grid>

          {/* position */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="position">Position</FormLabel>
              <MuiTextField
                name="position"
                control={control}
                rules={{ required: "User position is required" }}
                placeholder="Eg. Developer"
              />
            </FormControl>
          </Grid>

          {/* Role */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="column" justifyContent="center" spacing={1}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Role
              </Typography>
              <DropdownMenu
                name="role"
                control={control}
                options={userRoleTypes.filter(
                  (item) => item.label !== "superAdmin"
                )}
                // rules={{ required: "User role is required" }}
              />
            </Stack>
          </Grid>

          {/* isActive and isVerified */}
          {selectedUser && (
            <>
              {/* isActive */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="column" justifyContent="center" spacing={1}>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    User Status
                  </Typography>
                  <DropdownMenu
                    name="isActive"
                    control={control}
                    options={userActiveTypes}
                    rules={{ required: "User status is required" }}
                  />
                </Stack>
              </Grid>

              {/* isVerified */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="column" justifyContent="center" spacing={1}>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    Verification Status
                  </Typography>
                  <DropdownMenu
                    name="isVerified"
                    control={control}
                    options={userVerifiedTypes}
                    rules={{ required: "Verification field is required" }}
                  />
                </Stack>
              </Grid>
            </>
          )}

          {/* Email and Password */}
          {!selectedUser && (
            <>
              {/* Email */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <MuiTextField
                    name="email"
                    control={control}
                    // type="email"
                    placeholder="Eg. xyz@example.com"
                    rules={{
                      required: "User email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    }}
                  />
                </FormControl>
              </Grid>

              {/* Password */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <MuiTextField
                    name="password"
                    placeholder="••••••"
                    type={showPassword ? "text" : "password"}
                    // autoComplete="current-password"
                    control={control}
                    rules={{
                      required: "password is required",
                      minLength: {
                        value: 5,
                        message: "Password must be at least 5 characters",
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment
                          position="end"
                          onClick={togglePasswordVisibility}
                          sx={{ cursor: "pointer" }}
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </Grid>
            </>
          )}
        </Grid>
      )}
    </MuiFormDialog>
  );
};

CreateUpdateUser.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  selectedUser: PropTypes.object,
};

export default CreateUpdateUser;
