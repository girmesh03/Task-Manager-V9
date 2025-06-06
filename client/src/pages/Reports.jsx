import { useState } from "react";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import ListIcon from "@mui/icons-material/List";
import TimelineIcon from "@mui/icons-material/TimelineOutlined";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";

import TaskReportGrid from "../components/TaskReportGrid";
import RoutineTaskReportGrid from "../components/RoutineTaskReportGrid";

const Reports = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);

  const [tabIndex, setTabIndex] = useState("1");

  return (
    <Box sx={{ pb: 8 }}>
      <TabContext value={tabIndex}>
        <TabList
          aria-label="report panels"
          selectionFollowsFocus
          variant="scrollable"
          scrollButtons="auto"
          onChange={(event, newValue) => setTabIndex(newValue)}
          sx={{
            p: { xs: 1, sm: 2 },
            "& .MuiButtonBase-root:focus": { outline: "none" },
            "& .MuiTab-root": {
              color: (theme) => theme.palette.primary.main,
              fontWeight: 600,
            },
            "& .MuiTab-root:hover": {
              color: (theme) => theme.palette.primary.dark,
            },
          }}
        >
          <Tab
            label="Tasks"
            value="1"
            icon={<ListIcon />}
            iconPosition="start"
          />
          <Tab
            label="Routine"
            value="2"
            icon={<TimelineIcon />}
            iconPosition="start"
          />
        </TabList>

        {/* Assinged And Project Tasks */}
        <TabPanel value="1" sx={{ p: 0 }}>
          <TaskReportGrid departmentId={departmentId} />
        </TabPanel>

        {/* Routine Tasks */}
        <TabPanel value="2" sx={{ p: 0 }}>
          <RoutineTaskReportGrid departmentId={departmentId} />
        </TabPanel>
      </TabContext>
    </Box>
  );
};

export default Reports;
