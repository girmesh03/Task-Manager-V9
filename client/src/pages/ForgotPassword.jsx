import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";

import { makeRequest } from "../api/apiRequest";
import MuiTextField from "../components/MuiTextField";

const ForgotPassword = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (formData) => {
    setError("");
    try {
      const {
        data: { message },
      } = await makeRequest.post("/auth/forgot-password", {
        email: formData.email,
      });
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
        <Stack direction="column" spacing={2}>
          <Typography variant="h5" align="center">
            Forgot Your Password
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
              <FormLabel htmlFor="email">Email</FormLabel>
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

export default ForgotPassword;
