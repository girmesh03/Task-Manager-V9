import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import axios from "axios";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import {
  selectCurrentUser,
  setProfilePicture,
} from "../../redux/features/authSlice";
import { useUpdateMyProfilePictureMutation } from "../../redux/features/userApiSlice";

const CLOUDINARY_NAME = import.meta.env.VITE_CLOUDINARY_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`;

const ProfilePictureUploader = () => {
  const currentUser = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [isUploading, setIsUploading] = useState(false);
  const [updateProfilePicture] = useUpdateMyProfilePictureMutation();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      // 1) Upload to Cloudinary
      const { data } = await axios.post(UPLOAD_URL, formData);
      const { secure_url, public_id } = data;

      // 2) Send URL to your API
      const { user, message } = await updateProfilePicture({
        userId: currentUser._id,
        pictureData: { url: secure_url, public_id },
      }).unwrap();

      // 3) Sync Redux state
      dispatch(setProfilePicture(user.profilePicture));
      toast.success(message || "Profile picture updated!");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      // clear the input so selecting the same file twice still fires onChange
      e.target.value = "";
    }
  };

  return (
    <Card variant="outlined" sx={{ p: 2, maxWidth: 400, height: "100%" }}>
      <Typography variant="subtitle1" gutterBottom>
        Profile Picture
      </Typography>
      <Stack direction="row" alignItems="center" spacing={3}>
        <Avatar
          src={currentUser?.profilePicture?.url}
          alt={currentUser?.firstName}
          sx={{ width: 80, height: 80 }}
        />
        <Button
          variant="outlined"
          component="label"
          disabled={isUploading}
          startIcon={
            isUploading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isUploading ? "Uploading…" : "Upload New"}
          <input
            type="file"
            hidden
            accept="image/png, image/jpeg, image/gif"
            onChange={handleFileChange}
          />
        </Button>
      </Stack>
    </Card>
  );
};

export default ProfilePictureUploader;
