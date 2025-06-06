import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "react-toastify";

import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid2";
import CircularProgress from "@mui/material/CircularProgress";
import ArrowBackIosRoundedIcon from "@mui/icons-material/ArrowBackIosRounded";

import { makeRequest } from "../api/apiRequest";

const VerifyEmail = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerification = async (e) => {
    setLoading(true);
    e.preventDefault();
    setError(""); // Clear previous errors
    try {
      const { message } = await makeRequest.post("/auth/verify-email", {
        token: String(verificationCode),
      });

      toast.success(message);
      setVerificationCode("");
      navigate("/login", { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Invalid verification code. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack direction="column" sx={{ flexGrow: 1, px: 1, py: 2 }}>
      <Card
        variant="outlined"
        sx={{ maxWidth: 400, width: "100%", m: "auto", px: 2, py: 4 }}
      >
        <Stack direction="column" spacing={3}>
          <Typography variant="h5" textAlign="center">
            Verify Your Email
          </Typography>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            Please enter the 6-digit code sent to your email.
          </Typography>

          <Grid container spacing={1}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Grid size={{ xs: 2 }} key={index}>
                <TextField
                  variant="outlined"
                  required
                  value={verificationCode[index] || ""}
                  onChange={(e) => {
                    // 1) Take the raw input, convert it to uppercase (optional), then strip out anything other than 0–9 or A–Z.
                    const raw = e.target.value.toUpperCase();
                    const value = raw.replace(/[^0-9A-Z]/g, "");

                    if (value) {
                      // 2) Build a new verification string by replacing only the current index
                      const updatedArray = verificationCode.split("");
                      updatedArray[index] = value;
                      setVerificationCode(updatedArray.join(""));
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      style: { textAlign: "center" },
                      // This pattern also hints to the browser to only allow [A–Z0–9] on form submission
                      pattern: "[A-Z0-9]*",
                    },
                  }}
                />
              </Grid>
            ))}

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                size="small"
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress
                      disableShrink
                      size={20}
                      sx={{ color: "white" }}
                    />
                  ) : null
                }
                onClick={handleVerification}
              >
                Verify
              </Button>
            </Grid>
          </Grid>

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

export default VerifyEmail;
