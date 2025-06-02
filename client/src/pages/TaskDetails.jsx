import { useState } from "react";
import { Navigate, useParams } from "react-router";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import ListIcon from "@mui/icons-material/List";
import TimelineIcon from "@mui/icons-material/TimelineOutlined";
import AddIcon from "@mui/icons-material/Add";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { useGetTaskDetailsQuery } from "../redux/features/taskApiSlice";

import TaskDetailsCard from "../components/TaskDetailsCard";
import TaskTimeLines from "../components/TaskTimeLines";
import TaskActivityForm from "../components/TaskActivityForm";
import {
  LoadingFallback,
  LoadingBackdrop,
} from "../components/LoadingFallback";

const TaskDetails = () => {
  const { taskId } = useParams();
  const departmentId = useSelector(selectSelectedDepartmentId);

  const [tabIndex, setTabIndex] = useState("1");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, isLoading, isFetching, error, isError } =
    useGetTaskDetailsQuery({
      departmentId,
      taskId,
    });

  const { task = {}, activities = [] } = data || {};

  if (isLoading) return <LoadingFallback />;
  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Box sx={{ pb: 8 }}>
      <TabContext value={tabIndex}>
        <TabList
          aria-label="task panels"
          selectionFollowsFocus
          variant="scrollable"
          scrollButtons="auto"
          onChange={(event, newValue) => setTabIndex(newValue)}
          sx={{
            p: { xs: 1, sm: 2 },
            "& .MuiButtonBase-root:focus": { outline: "none" },
            "& .MuiTab-root": {
              color: theme.palette.primary.main,
              fontWeight: 600,
            },
            "& .MuiTab-root:hover": {
              color: theme.palette.primary.dark,
            },
          }}
        >
          <Tab
            label="Details"
            value="1"
            icon={<ListIcon />}
            iconPosition="start"
          />
          <Tab
            label="Timeline"
            value="2"
            icon={<TimelineIcon />}
            iconPosition="start"
          />
          <Tab
            label="Activity"
            value="3"
            icon={<AddIcon />}
            iconPosition="start"
            sx={{ ml: "auto" }}
          />
        </TabList>

        {/* Task Details */}
        <TabPanel value="1" sx={{ p: 0, px: 0.5 }}>
          <TaskDetailsCard task={task} />
        </TabPanel>

        {/* Timeline */}
        <TabPanel value="2" sx={{ p: isMobile ? 0.5 : 2 }}>
          <TaskTimeLines activities={activities} />
        </TabPanel>

        {/* Create Activity Form */}
        <TabPanel value="3" sx={{ p: 0.5, pb: 2 }}>
          <TaskActivityForm
            taskId={taskId}
            taskStatus={task?.status}
            taskType={
              task?.taskType === "AssignedTask"
                ? "Assigned Task"
                : "Project Task"
            }
            setTabIndex={setTabIndex}
          />
        </TabPanel>
      </TabContext>
      {isFetching && <LoadingBackdrop open={isFetching} />}
    </Box>
  );
};

export default TaskDetails;
