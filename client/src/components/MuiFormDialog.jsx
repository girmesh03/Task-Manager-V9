import PropTypes from "prop-types";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";

const MuiFormDialog = ({
  title,
  open,
  handleClose,
  handleSubmit,
  isSubmitting,
  children,
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          component: "form",
          autoComplete: "off",
          noValidate: true,
          onSubmit: (event) => {
            event.stopPropagation();
            event.preventDefault();
            handleSubmit()(event);
          },
          sx: (theme) => ({
            backgroundImage: "none",
            backgroundColor: "none",
            p: 1,
            borderRadius: theme.shape.borderRadius,
            [theme.breakpoints.down("sm")]: {
              m: 0,
              p: 0,
              minHeight: "100dvh",
              width: "100vw",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          px: 4,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent
        sx={{
          // my: 1,
          px: { xs: 1, sm: 2 },
          py: 0,
          flexGrow: 1,
          overflowY: "auto",
        }}
      >
        {children}
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: 1,
          borderColor: "divider",
          px: 4,
          py: 2,
        }}
      >
        <Button
          onClick={handleClose}
          size="small"
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          size="small"
          variant="contained"
          color="secondary"
          loading={isSubmitting}
          loadingPosition="center"
          loadingIndicator={
            <CircularProgress size={20} sx={{ color: "white" }} />
          }
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

MuiFormDialog.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default MuiFormDialog;
