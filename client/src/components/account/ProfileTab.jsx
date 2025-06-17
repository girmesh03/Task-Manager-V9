// FILE: src/components/account/ProfileTab.jsx

import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/features/authSlice";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import ProfilePictureUploader from "./ProfilePictureUploader";

const ProfileInfoDisplay = () => {
  const currentUser = useSelector(selectCurrentUser);

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <Typography variant="subtitle1" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <strong>First Name:</strong> {currentUser?.firstName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <strong>Last Name:</strong> {currentUser?.lastName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        <strong>Position:</strong> {currentUser?.position}
      </Typography>
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        Please contact a SuperAdmin to update these details.
      </Typography>
    </Card>
  );
};

const ProfileTab = () => {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <ProfileInfoDisplay />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <ProfilePictureUploader />
      </Grid>
    </Grid>
  );
};

export default ProfileTab;
