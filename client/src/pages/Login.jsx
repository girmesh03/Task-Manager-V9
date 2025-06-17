import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import AuthContent from "../components/AuthContent";
import MuiTextField from "../components/MuiTextField";
import { setCredentials, selectIsLoading } from "../redux/features/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = location.state?.from?.pathname || "/dashboard";

  const isLoading = useSelector(selectIsLoading);
  const { handleSubmit, control, reset } = useForm({
    defaultValues: useMemo(() => ({ email: "", password: "" }), []),
  });

  const [showPassword, setShowPassword] = useState(false);
  const togglePassword = () => setShowPassword((prev) => !prev);

  const onSubmit = async (formData) => {
    try {
      const response = await dispatch(setCredentials(formData)).unwrap();
      toast.success(response.message || "Login successful");
      reset();
      navigate(fromPath, { replace: true });
    } catch (error) {
      const errMsg = error?.data?.message || error?.message || "Login failed";
      toast.error(errMsg);
    }
  };

  return (
    <Grid
      container
      direction={{ xs: "column-reverse", md: "row" }}
      spacing={4}
      sx={{ py: 4, px: 1, maxWidth: { xs: 450, md: 900 }, m: "auto" }}
    >
      <Grid size={{ xs: 12, md: 6 }} sx={{ m: "auto" }}>
        <AuthContent />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card
          variant="outlined"
          sx={{ px: { xs: 2, md: 3 }, py: 8, m: "auto" }}
        >
          <Typography variant="h4" textAlign="center" gutterBottom>
            Welcome Back!
          </Typography>
          <CardContent
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            autoComplete="off"
            sx={{ mt: 4 }}
          >
            <MuiTextField
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              }}
              formLabel="Email"
              placeholder="xyz@example.com"
              autoComplete="email"
              disabled={isLoading}
              formControlProps={{ margin: "dense" }}
              formLabelProps={{ required: true }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <MuiTextField
              name="password"
              control={control}
              rules={{
                required: "Password is required",
                minLength: {
                  value: 5,
                  message: "Password must be at least 5 characters",
                },
              }}
              formLabel="Password"
              placeholder="••••••"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isLoading}
              formControlProps={{ margin: "dense" }}
              formLabelProps={{ required: true }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment
                      position="end"
                      size="small"
                      sx={{ cursor: isLoading ? "default" : "pointer" }}
                      onClick={togglePassword}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon fontSize="small" />
                      ) : (
                        <VisibilityIcon fontSize="small" />
                      )}
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              size="small"
              disabled={isLoading}
              loading={isLoading}
              loadingIndicator={
                <CircularProgress size={20} sx={{ color: "white" }} />
              }
              loadingPosition="start"
              sx={{ mt: 2 }}
            >
              {isLoading ? "Logging In..." : "Login"}
            </Button>
          </CardContent>
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            fullWidth
            disabled={isLoading}
            onClick={() => navigate("/forgot-password")}
            sx={{ mt: 2 }}
          >
            Forgot Password
          </Button>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Login;
