import { memo, useEffect } from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Grid from "@mui/material/Grid";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useGetUsersQuery } from "../../redux/features/userApiSlice";
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from "../../redux/features/departmentApiSlice";

import MuiFormDialog from "../MuiFormDialog";
import MuiTextField from "../MuiTextField";
import MuiAutocomplete from "../MuiAutocomplete";
import { LoadingFallback } from "../LoadingFallback";

const CreateUpdateDepartmentForm = memo(
  ({ open, handleClose, title, selectedDept }) => {
    const [updateDepartment] = useUpdateDepartmentMutation();
    const [createDepartment] = useCreateDepartmentMutation();

    const {
      data = {},
      isError,
      error,
      isLoading,
    } = useGetUsersQuery(
      {
        departmentId: selectedDept?._id,
        page: 1,
        limit: 100,
      },
      {
        skip: !selectedDept,
      }
    );

    const { users = [] } = data;

    const {
      handleSubmit,
      control,
      reset,
      formState: { isSubmitting },
    } = useForm({
      defaultValues: {
        name: "",
        description: "",
      },
    });

    const onSubmit = async (formData) => {
      let departmentData = {
        name: "",
        description: "",
        managers: [],
      };

      if (selectedDept) {
        departmentData = {
          name: formData.name,
          description: formData.description,
          managers: formData.managers,
        };
      } else {
        departmentData = {
          name: formData.name,
          description: formData.description,
          managers: [],
        };
      }

      try {
        let response;
        if (selectedDept) {
          response = await updateDepartment({
            departmentId: selectedDept?._id,
            updateData: departmentData,
          }).unwrap();
        } else {
          response = await createDepartment({
            departmentData,
          }).unwrap();
        }
        toast.success(response.message);
        reset();
        handleClose();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to update department");
      }
    };

    useEffect(() => {
      if (selectedDept) {
        reset({
          name: selectedDept.name,
          description: selectedDept.description,
          managers: selectedDept?.managers?.map((user) => user._id) || [],
        });
      }
    }, [selectedDept, reset]);

    if (isError) return <Navigate to="/error" state={{ error }} replace />;

    return (
      <MuiFormDialog
        title={title}
        open={open}
        handleClose={handleClose}
        handleSubmit={() => handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      >
        {isLoading ? (
          <LoadingFallback height="50vh" />
        ) : (
          <Grid container spacing={2} sx={{ my: 2 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="name">Department Name</FormLabel>
                <MuiTextField
                  name="name"
                  control={control}
                  rules={{ required: "Department name is required" }}
                  placeholder="Eg. Engineering"
                />
              </FormControl>
            </Grid>

            {/* description */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <FormLabel htmlFor="description">
                  Department Description
                </FormLabel>
                <MuiTextField
                  name="description"
                  placeholder="Eg. Department of Engineering"
                  control={control}
                  rules={{ required: "Department description is required" }}
                  multiline
                  rows={3}
                />
              </FormControl>
            </Grid>

            {selectedDept && (
              <Grid size={{ xs: 12 }}>
                <Stack direction="column" justifyContent="center" spacing={1}>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    Department Managers
                  </Typography>
                  <MuiAutocomplete
                    name="managers"
                    control={control}
                    options={users}
                    //   rules={{ required: "At least one user must be selected" }}
                    multiple
                    fullWidth
                  />
                </Stack>
              </Grid>
            )}
          </Grid>
        )}
      </MuiFormDialog>
    );
  }
);

CreateUpdateDepartmentForm.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  selectedDept: PropTypes.object,
};

export default CreateUpdateDepartmentForm;
