import { forwardRef } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";

const ConfirmDialog = forwardRef(
  (
    {
      open,
      onClose,
      onConfirm,
      title,
      description,
      confirmText,
      cancelText,
      children,
      disableBackdropClick = true,
      ...other
    },
    ref
  ) => {
    const safeClose = (event, reason) => {
      // optional blur to avoid hidden-focus issues
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      // allow close on escape/backdrop if not disabled
      if (
        disableBackdropClick &&
        (reason === "backdropClick" || reason === "escapeKeyDown")
      ) {
        return;
      }
      onClose(event, reason);
    };

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={safeClose}
        disableEscapeKeyDown={disableBackdropClick}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: (theme) => ({
              backgroundImage: "none",
              backgroundColor: "none",
              padding: theme.spacing(0),
              borderRadius: theme.shape.borderRadius,
            }),
          },
        }}
        {...other}
      >
        <DialogTitle id="confirm-dialog-title" sx={{ pb: 1 }}>
          {title}
        </DialogTitle>
        <DialogContent dividers>
          {description ? (
            <DialogContentText id="confirm-dialog-description">
              {description}
            </DialogContentText>
          ) : (
            children
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={safeClose} color="inherit" size="small">
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            autoFocus
            aria-label={confirmText}
            size="small"
            variant="contained"
            color="secondary"
          >
            {confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  children: PropTypes.node,
  disableBackdropClick: PropTypes.bool,
};

export default ConfirmDialog;
