import { useState, useEffect } from "react";
import { Navigate } from "react-router";
import { styled } from "@mui/material/styles";
import MuiAvatar from "@mui/material/Avatar";
import MuiListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import CircularProgress from "@mui/material/CircularProgress";
import Toolbar from "@mui/material/Toolbar";
import Select, { selectClasses } from "@mui/material/Select";
import Pagination from "@mui/material/Pagination";
import Box from "@mui/material/Box";
// import Button from "@mui/material/Button";
// import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";

import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedDepartmentId,
  setSelectedDepartmentId,
} from "../redux/features/authSlice";
import { useGetAllDepartmentsQuery } from "../redux/features/departmentApiSlice";

// import useAuth from "../hooks/useAuth";

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.secondary,
  border: `1px solid ${theme.palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

const ITEMS_PER_PAGE = 10;
const DROPDOWN_MAX_HEIGHT = 300;

const DepartmentMenu = () => {
  // const { isAdminOrSuperAdmin } = useAuth();
  const selectedDepartmentId = useSelector(selectSelectedDepartmentId);
  const dispatch = useDispatch();

  const [page, setPage] = useState(1);

  const {
    data = {},
    isLoading,
    isError,
    error,
  } = useGetAllDepartmentsQuery(
    { page, limit: ITEMS_PER_PAGE },
    { refetchOnMountOrArgChange: true }
  );

  const { departments = [], pagination = {} } = data;
  const { totalPages = 1 } = pagination;

  const handleChange = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const newDepartment = event.target.value;
    dispatch(setSelectedDepartmentId(newDepartment));
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  if (isLoading) {
    return (
      <Toolbar variant="dense" sx={{ justifyContent: "center" }}>
        <CircularProgress size={20} disableShrink />
      </Toolbar>
    );
  }

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Box sx={{ px: 1, pt: 1 }}>
      <Select
        labelId="department-select"
        id="company-department-select"
        value={
          departments.find((dept) => dept._id === selectedDepartmentId)?._id ||
          ""
        }
        onChange={handleChange}
        // displayEmpty
        inputProps={{ "aria-label": "Select department" }}
        fullWidth
        MenuProps={{
          PaperProps: {
            sx: { maxHeight: DROPDOWN_MAX_HEIGHT, overflowY: "auto" },
          },
        }}
        sx={{
          p: 0,
          [`& .${selectClasses.select}`]: {
            display: "flex",
            alignItems: "center",
            gap: "2px",
            pl: 1,
          },
        }}
      >
        <ListSubheader sx={{ pt: 0 }}>Departments</ListSubheader>
        {departments.map((dept) => (
          <MenuItem key={dept._id} value={dept._id} sx={{ mb: 1 }}>
            <ListItemAvatar>
              <Avatar alt={dept.name}>
                <DevicesRoundedIcon sx={{ fontSize: "1rem" }} />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={dept.name} secondary={dept.name} />
          </MenuItem>
        ))}
        <Box sx={{ display: "flex", justifyContent: "center", p: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            size="small"
          />
        </Box>
      </Select>
    </Box>
  );
};

export default DepartmentMenu;
