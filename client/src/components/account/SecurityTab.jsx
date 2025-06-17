import Grid from "@mui/material/Grid2";
import ChangeEmailForm from "./ChangeEmailForm";
import ChangePasswordForm from "./ChangePasswordForm";

const SecurityTab = () => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChangeEmailForm />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ChangePasswordForm />
      </Grid>
    </Grid>
  );
};

export default SecurityTab;
