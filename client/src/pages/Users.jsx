import { Navigate } from "react-router";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { useGetUsersQuery } from "../redux/features/userApiSlice";

import MuiDataGrid from "../components/MuiDataGrid";
import {
  LoadingFallback,
  LoadingBackdrop,
} from "../components/LoadingFallback";

import { UserColumns } from "../utils/columns";

const Users = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);

  const {
    data = {},
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetUsersQuery({
    departmentId,
    role: "User",
    page: 1,
    limit: 10,
  });

  const { users = [] } = data || {};

  if (isLoading) return <LoadingFallback />;
  if (isFetching) return <LoadingBackdrop open={isFetching} />;
  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 } }}>
      <Typography component="h2" variant="h6" sx={{ my: 2 }}>
        Users
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <MuiDataGrid rows={users} columns={UserColumns} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Users;
