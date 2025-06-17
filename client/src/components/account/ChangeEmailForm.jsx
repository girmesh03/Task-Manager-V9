import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import { Visibility, VisibilityOff, Lock } from "@mui/icons-material";

import { useDispatch, useSelector } from "react-redux";
import {
  useInitiateEmailChangeMutation,
  useVerifyEmailChangeMutation,
} from "../../redux/features/userApiSlice";
import { selectCurrentUser, setLogout } from "../../redux/features/authSlice";

import MuiTextField from "../MuiTextField";

const PasswordField = ({
  name,
  label,
  control,
  rules,
  show,
  toggle,
  disabled,
}) => (
  <MuiTextField
    name={name}
    control={control}
    rules={rules}
    formLabel={label}
    type={show ? "text" : "password"}
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
            onClick={!disabled ? toggle : undefined}
          >
            {show ? (
              <VisibilityOff fontSize="small" />
            ) : (
              <Visibility fontSize="small" />
            )}
          </InputAdornment>
        ),
      },
    }}
  />
);

const ChangeEmailForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  const [initiate, { isLoading: initiating }] =
    useInitiateEmailChangeMutation();
  const [verify, { isLoading: verifying }] = useVerifyEmailChangeMutation();

  const {
    control: initControl,
    handleSubmit: onInitSubmit,
    reset: resetInit,
  } = useForm({
    defaultValues: useMemo(() => ({ newEmail: "", password: "" }), []),
  });

  const {
    control: verifyControl,
    handleSubmit: onVerifySubmit,
    reset: resetVerify,
  } = useForm({ defaultValues: useMemo(() => ({ token: "" }), []) });

  const togglePassword = () => setShowPassword((prev) => !prev);

  const submitInit = async (data) => {
    try {
      const { message } = await initiate({
        userId: currentUser._id,
        emailData: { newEmail: data.newEmail, password: data.password },
      }).unwrap();
      toast.success(message);
      setStep(2);
      resetInit();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to initiate email change.");
    }
  };

  const submitVerify = async ({ token }) => {
    try {
      await verify({ userId: currentUser._id, tokenData: { token } }).unwrap();
      toast.success("Email changed successfully!");
      setStep(1);
      resetVerify();

      dispatch(setLogout());
      toast.success("You have been logged out.");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err?.data?.message || "Verification failed.");
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{ py: 4, height: "100%", maxWidth: 400, mx: "auto" }}
    >
      <CardHeader
        title={<Typography variant="h6">Change Email Address</Typography>}
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
        <Alert severity="info">Current Email: {currentUser?.email}</Alert>

        {step === 1 && (
          <Box component="form" onSubmit={onInitSubmit(submitInit)} noValidate>
            <MuiTextField
              name="newEmail"
              control={initControl}
              rules={{ required: "New email is required" }}
              formLabel="New Email"
              placeholder="xyz@example.com"
              autoComplete="off"
              disabled={initiating}
            />
            <PasswordField
              name="password"
              label="Current Password"
              control={initControl}
              rules={{ required: "Password is required" }}
              show={showPassword}
              toggle={togglePassword}
              disabled={initiating}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              disabled={initiating}
              loading={initiating}
              loadingIndicator={
                <CircularProgress size={20} sx={{ color: "white" }} />
              }
              loadingPosition="start"
            >
              Request Verification Code
            </Button>
          </Box>
        )}

        {step === 2 && (
          <Box
            component="form"
            onSubmit={onVerifySubmit(submitVerify)}
            noValidate
          >
            <Stack spacing={2}>
              <Typography variant="body2">
                A 6-digit code has been sent to your new email. Enter it below.
              </Typography>
              <MuiTextField
                name="token"
                control={verifyControl}
                rules={{ required: "Verification code is required" }}
                formLabel="Verification Code"
                placeholder="••••••"
                formControlProps={{ margin: "normal" }}
                formLabelProps={{ required: true }}
                disabled={verifying}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setStep(1);
                    resetVerify();
                  }}
                  disabled={verifying}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  sx={{ display: "flex", alignItems: "center" }}
                  disabled={verifying}
                  loading={verifying}
                  loadingIndicator={
                    <CircularProgress size={20} sx={{ color: "white" }} />
                  }
                  loadingPosition="start"
                >
                  Verify Email
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChangeEmailForm;
