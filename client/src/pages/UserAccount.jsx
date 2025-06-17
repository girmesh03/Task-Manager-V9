import { useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

import ProfileTab from "../components/account/ProfileTab";
import SecurityTab from "../components/account/SecurityTab";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`account-tabpanel-${index}`}
      aria-labelledby={`account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const UserAccount = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="md" sx={{ pt: 3, pb: { xs: 8, sm: 10, md: 2 } }}>
      <Typography variant="h4" gutterBottom>
        My Account
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="account tabs">
          <Tab
            icon={<AccountCircleIcon />}
            iconPosition="start"
            label="Profile"
            id="account-tab-0"
          />
          <Tab
            icon={<VpnKeyIcon />}
            iconPosition="start"
            label="Security & Login"
            id="account-tab-1"
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <ProfileTab />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <SecurityTab />
      </TabPanel>
    </Container>
  );
};

export default UserAccount;
