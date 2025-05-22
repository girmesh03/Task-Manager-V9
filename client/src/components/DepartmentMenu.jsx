// react
// import { Navigate } from "react-router";

// mui
import { styled } from "@mui/material/styles";
import MuiAvatar from "@mui/material/Avatar";
import MuiListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Toolbar from "@mui/material/Toolbar";
import Select, { selectClasses } from "@mui/material/Select";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";

// redux
import { useSelector, useDispatch } from "react-redux";
import {
  selectSelectedDepartmentId,
  setSelectedDepartmentId,
} from "../redux/features/authSlice";
import { useGetAllDepartmentsQuery } from "../redux/features/departmentApiSlice";

// hooks
import useAuth from "../hooks/useAuth";

// styled components
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

const DepartmentMenu = () => {
  const { isAdminOrSuperAdmin } = useAuth();
  const selectedDepartmentId = useSelector(selectSelectedDepartmentId);
  const dispatch = useDispatch();

  const {
    data = {},
    isLoading,
    // isError,
    // error,
  } = useGetAllDepartmentsQuery(
    { page: 1, limit: 10 }
    // { refetchOnMountOrArgChange: true }
  );

  const { departments = [] } = data;

  const handleChange = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const newDepartment = event.target.value;
    dispatch(setSelectedDepartmentId(newDepartment));
  };

  if (isLoading)
    return (
      <Toolbar variant="dense" sx={{ justifyContent: "center" }}>
        <CircularProgress size={20} disableShrink />
      </Toolbar>
    );

  // if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Select
      labelId="department-select"
      id="company-department-select"
      value={selectedDepartmentId}
      onChange={handleChange}
      displayEmpty
      inputProps={{ "aria-label": "Select department" }}
      fullWidth
      disabled={!isAdminOrSuperAdmin}
      sx={{
        maxHeight: 56,
        "&.MuiList-root": {
          p: "81px",
        },
        [`& .${selectClasses.select}`]: {
          display: "flex",
          alignItems: "center",
          gap: "2px",
          pl: 1,
        },
      }}
    >
      <ListSubheader sx={{ pt: 0 }}>Departments</ListSubheader>
      {departments?.map((dept) => (
        <MenuItem key={dept._id} value={dept._id} sx={{ mb: 1 }}>
          <ListItemAvatar>
            <Avatar alt={dept.name}>
              <DevicesRoundedIcon sx={{ fontSize: "1rem" }} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={dept.name} secondary={dept.name} />
        </MenuItem>
      ))}
      <Divider sx={{ mx: -1 }} />
      <MenuItem value="add">
        <ListItemIcon>
          <AddRoundedIcon />
        </ListItemIcon>
        <ListItemText primary="Add department" />
      </MenuItem>
    </Select>
  );
};

export default DepartmentMenu;
