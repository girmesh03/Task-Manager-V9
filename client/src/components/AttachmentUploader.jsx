import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const CLOUDINARY_NAME = import.meta.env.VITE_CLOUDINARY_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
// Note: Use 'raw/upload' for non-image files like PDFs, and 'image/upload' for images.
// We will let Cloudinary auto-detect the resource type.
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/auto/upload`;

const AttachmentUploader = ({
  onUploadComplete,
  initialFiles = [],
  maxFiles = 5,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState(initialFiles);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`You can only upload a maximum of ${maxFiles} files.`);
      return;
    }

    setIsUploading(true);

    const uploadPromises = files.map((file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      return axios.post(UPLOAD_URL, formData);
    });

    try {
      const responses = await Promise.all(uploadPromises);
      const newFiles = responses.map(({ data }) => ({
        url: data.secure_url,
        public_id: data.public_id,
        name: data.original_filename,
        type: data.resource_type === "raw" ? "document" : "image", // Classify for backend
      }));

      const updatedFileList = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFileList);
      onUploadComplete(updatedFileList); // Notify parent component

      toast.success(`${newFiles.length} file(s) uploaded successfully!`);
    } catch (err) {
      console.error("Upload Error:", err);
      toast.error("An error occurred during upload. Please try again.");
    } finally {
      setIsUploading(false);
      // Clear the input to allow re-selecting the same file
      e.target.value = "";
    }
  };

  const handleRemoveFile = useCallback(
    (publicIdToRemove) => {
      const updatedFiles = uploadedFiles.filter(
        (file) => file.public_id !== publicIdToRemove
      );
      setUploadedFiles(updatedFiles);
      onUploadComplete(updatedFiles); // Notify parent of the removal
    },
    [uploadedFiles, onUploadComplete]
  );

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Attachments</Typography>
        <Button
          variant="outlined"
          component="label"
          disabled={isUploading || uploadedFiles.length >= maxFiles}
          startIcon={
            isUploading ? <CircularProgress size={20} /> : <UploadFileIcon />
          }
        >
          {isUploading ? "Uploading..." : "Upload Files"}
          <input
            type="file"
            hidden
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileChange}
          />
        </Button>
        {uploadedFiles.length > 0 && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {uploadedFiles.length} / {maxFiles} files uploaded
            </Typography>
            <List dense>
              {uploadedFiles.map((file) => (
                <ListItem
                  key={file.public_id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleRemoveFile(file.public_id)}
                      disabled={isUploading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <InsertDriveFileIcon
                    sx={{ mr: 1, color: "text.secondary" }}
                  />
                  <ListItemText
                    primary={file.name}
                    slotProps={{
                      primary: {
                        noWrap: true,
                        sx: { maxWidth: "250px" },
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Stack>
    </Card>
  );
};

export default AttachmentUploader;
