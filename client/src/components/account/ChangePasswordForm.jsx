import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";

import MuiTextField from "../MuiTextField";
import { useChangeMyPasswordMutation } from "../../redux/features/userApiSlice";
import { selectCurrentUser, setLogout } from "../../redux/features/authSlice";

const PasswordField = ({
  name,
  label,
  control,
  rules,
  type,
  toggleType,
  disabled,
}) => (
  <MuiTextField
    name={name}
    control={control}
    rules={rules}
    formLabel={label}
    type={type}
    placeholder="••••••"
    autoComplete="off"
    disabled={disabled}
    formControlProps={{ margin: "dense" }}
    formLabelProps={{ required: !!rules.required }}
    slotProps={{
      input: {
        startAdornment: (
          <InputAdornment position="start">
            <Lock color="primary" fontSize="small" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment
            position="end"
            sx={{ cursor: disabled ? "default" : "pointer" }}
            // onClick={!disabled ? toggleVisibility : undefined}
            onClick={toggleType}
            disabled={disabled}
          >
            {type === "password" ? (
              <Visibility fontSize="small" />
            ) : (
              <VisibilityOff fontSize="small" />
            )}
          </InputAdornment>
        ),
      },
    }}
  />
);

const ChangePasswordForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [changeMyPassword, { isLoading }] = useChangeMyPasswordMutation();

  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: useMemo(
      () => ({ currentPassword: "", newPassword: "", confirmPassword: "" }),
      []
    ),
  });

  // Separate visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (data) => {
    try {
      await changeMyPassword({
        userId: currentUser._id,
        passwordData: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
      }).unwrap();

      toast.success("Password changed successfully.");
      reset();

      dispatch(setLogout());
      toast.success("You have been logged out.");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to change password.");
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ py: 4, height: "100%", maxWidth: 400, mx: "auto" }}
    >
      <CardHeader
        title={<Typography variant="h6">Change Password</Typography>}
        sx={{ textAlign: "center", pb: 0 }}
      />
      <CardContent
        sx={{
          height: "95%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <PasswordField
            name="currentPassword"
            label="Current Password"
            control={control}
            rules={{ required: "Current password is required" }}
            type={showCurrent ? "text" : "password"}
            toggleType={() => setShowCurrent((prev) => !prev)}
            disabled={isLoading}
          />

          <PasswordField
            name="newPassword"
            label="New Password"
            control={control}
            rules={{
              required: "New password is required",
              minLength: { value: 6, message: "At least 6 characters" },
            }}
            type={showNew ? "text" : "password"}
            toggleType={() => setShowNew((prev) => !prev)}
            disabled={isLoading}
          />

          <PasswordField
            name="confirmPassword"
            label="Confirm Password"
            control={control}
            rules={{
              required: "Please confirm your password",
              validate: (val) =>
                val === watch("newPassword") || "Passwords do not match",
            }}
            type={showConfirm ? "text" : "password"}
            toggleType={() => setShowConfirm((prev) => !prev)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            size="small"
            fullWidth
            sx={{ mt: 2 }}
            disabled={isLoading}
            loading={isLoading}
            loadingIndicator={
              <CircularProgress size={20} sx={{ color: "white" }} />
            }
            loadingPosition="start"
          >
            Save Changes
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;
