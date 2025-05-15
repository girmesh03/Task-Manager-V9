// react
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

// mui
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid2";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Lock from "@mui/icons-material/Lock";
import Email from "@mui/icons-material/Email";

// Redux
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, selectIsLoading } from "../redux/features/authSlice";

// Components
import AuthContent from "../components/AuthContent";

const Login = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const onSubmit = async (formData) => {
    try {
      const response = await dispatch(setCredentials(formData)).unwrap();
      // console.log("response", response);
      toast.success(response.message || "Login successful");
      reset();
      navigate(location.state?.from?.pathname || "/dashboard");
    } catch (error) {
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <Grid
      container
      direction={{ xs: "column-reverse", md: "row" }}
      spacing={4}
      sx={{ py: 4, px: 1, maxWidth: { xs: 450, md: 900 }, m: "auto" }}
    >
      {/* Auth Content Section */}
      <Grid size={{ xs: 12, md: 6 }} sx={{ m: "auto" }}>
        <AuthContent />
      </Grid>

      {/* Login Form Section */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          variant="outlined"
          sx={{ px: { xs: 2, md: 3 }, py: 8, m: "auto" }}
        >
          <Typography variant="h4" textAlign="center" gutterBottom>
            Welcome Back!
          </Typography>

          <Grid
            container
            spacing={3}
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
            sx={{ mt: 4 }}
          >
            <Grid size={12}>
              <Typography
                variant="caption"
                component="label"
                htmlFor="email"
                sx={{ ml: 1, mb: 0.5, display: "inline-flex" }}
              >
                Email
              </Typography>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    id="email"
                    placeholder="your@email.com"
                    autoComplete="email"
                    type="text"
                    size="small"
                    fullWidth
                    variant="outlined"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="primary" fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={12}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 0.5 }}
              >
                <Typography
                  variant="caption"
                  component="label"
                  htmlFor="password"
                  sx={{ ml: 1 }}
                >
                  Password
                </Typography>
                <Typography
                  component={Link}
                  to="/forgot-password"
                  variant="caption"
                  sx={{
                    mr: 1,
                    textDecoration: "none",
                    color: "inherit",
                    "&:hover": {
                      textDecoration: "underline",
                      color: "primary.main",
                    },
                  }}
                >
                  Forgot password?
                </Typography>
              </Stack>

              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Password is required",
                  minLength: {
                    value: 5,
                    message: "Password must be at least 5 characters",
                  },
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    id="password"
                    placeholder="••••••"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"}
                    size="small"
                    fullWidth
                    variant="outlined"
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
                            size="small"
                            sx={{ cursor: "pointer" }}
                            onClick={togglePasswordVisibility}
                          >
                            {showPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </InputAdornment>
                        ),
                      },
                    }}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </Grid>

            <Grid size={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                size="small"
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Log in"
                )}
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Login;
