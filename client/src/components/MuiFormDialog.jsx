import { forwardRef } from "react";
import PropTypes from "prop-types";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";

const MuiFormDialog = forwardRef(
  (
    {
      title,
      open,
      handleClose,
      handleSubmit,
      isSubmitting,
      children,
      disableBackdropClick = false,
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
      handleClose(event, reason);
    };

    return (
      <Dialog
        ref={ref}
        open={open}
        onClose={safeClose}
        disableEscapeKeyDown={disableBackdropClick}
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
        <DialogTitle>{title}</DialogTitle>
        <DialogContent
          dividers
          sx={{ px: { xs: 1, sm: 2 }, py: 0, flexGrow: 1, overflowY: "auto" }}
        >
          {children}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={safeClose}
            size="small"
            variant="outlined"
            sx={{ mr: 2 }}
            aria-label="Cancel"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            size="small"
            variant="contained"
            color="secondary"
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
            aria-label="Submit"
          >
            {isSubmitting ? "Submitting…" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

MuiFormDialog.propTypes = {
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  children: PropTypes.node.isRequired,
  disableBackdropClick: PropTypes.bool,
};

export default MuiFormDialog;
