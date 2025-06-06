import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";

import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import MuiTextField from "../components/MuiTextField";
import { makeRequest } from "../api/apiRequest";

const ResetPassword = () => {
  const { resetToken } = useParams();

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
    watch,
  } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formData) => {
    if (formData.newPassword !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setError("");
    try {
      const { message } = await makeRequest.post(
        `/auth/reset-password/${resetToken}`,
        {
          password: formData.newPassword,
        }
      );
      reset();
      toast.success(message);
      navigate("/login", { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";

      setError(errorMessage);
    }
  };

  return (
    <Stack direction="column" sx={{ flexGrow: 1, px: 1, py: 2 }}>
      <Card
        variant="outlined"
        sx={{ maxWidth: 400, width: "100%", m: "auto", px: 2, py: 4 }}
      >
        <Stack direction="column" spacing={3}>
          <Typography variant="h5" align="center">
            Reset Your Password
          </Typography>

          {/* form */}
          <Stack
            direction="column"
            spacing={2}
            component="form"
            autoComplete="off"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormControl fullWidth>
              <FormLabel htmlFor="newPassword">New Password</FormLabel>
              <MuiTextField
                name="newPassword"
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                // autoComplete="current-password"
                control={control}
                rules={{
                  required: "New password is required",
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
            <FormControl fullWidth>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <MuiTextField
                name="confirmPassword"
                placeholder="••••••"
                type={showConfirmPassword ? "text" : "password"}
                // autoComplete="current-password"
                control={control}
                rules={{
                  required: "Confirm password is required",
                  minLength: {
                    value: 5,
                    message: "Password must be at least 5 characters",
                  },
                  validate: (value) => {
                    if (value !== watch("newPassword")) {
                      return "Passwords do not match";
                    }
                    return true;
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      onClick={toggleConfirmVisibility}
                      sx={{ cursor: "pointer" }}
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              size="small"
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress
                    disableShrink
                    size={20}
                    sx={{ color: "white" }}
                  />
                ) : null
              }
            >
              Get Reset Link
            </Button>
          </Stack>

          {/* error */}
          {error && (
            <Alert severity="error" role="alert" aria-live="polite">
              {error}
            </Alert>
          )}

          <Button
            variant="outlined"
            component={Link}
            to="/login"
            startIcon={<ArrowBackIosRoundedIcon />}
            aria-label="Back to Login"
            fullWidth
          >
            Back to Login
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
};

export default ResetPassword;
