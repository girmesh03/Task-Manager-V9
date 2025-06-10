import { useState } from "react";

import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import DepartmentIcon from "@mui/icons-material/Business";
import UsersIcon from "@mui/icons-material/Group";

import DepartmentsSection from "../components/admin/DepartmentsSection";
import UsersSection from "../components/admin/UsersSection";

const AdminPanel = () => {
  const [tabIndex, setTabIndex] = useState("1");

  return (
    <TabContext value={tabIndex}>
      <TabList
        aria-label="admin panels"
        selectionFollowsFocus
        variant="scrollable"
        scrollButtons="auto"
        onChange={(event, newValue) => setTabIndex(newValue)}
        sx={{
          p: 1,
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
          label="Departments"
          value="1"
          icon={<DepartmentIcon fontSize="small" />}
          iconPosition="start"
        />
        <Tab
          label="Users"
          value="2"
          icon={<UsersIcon fontSize="small" />}
          iconPosition="start"
          sx={{ ml: 1 }}
        />
      </TabList>

      {/* departments section */}
      <TabPanel value="1" sx={{ p: 1 }}>
        <DepartmentsSection />
      </TabPanel>

      {/* users section */}
      <TabPanel value="2" sx={{ p: 1 }}>
        <UsersSection />
      </TabPanel>
    </TabContext>
  );
};

export default AdminPanel;
