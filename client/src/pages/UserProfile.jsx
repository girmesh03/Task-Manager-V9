import { Navigate, useParams } from "react-router";
import dayjs from "dayjs";
import PropTypes from "prop-types";

import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { useGetUserProfileQuery } from "../redux/features/userApiSlice";

import {
  LoadingBackdrop,
  LoadingFallback,
} from "../components/LoadingFallback";

// Reusable component for rendering area gradient for LineChart
function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

// Reusable LineChart component for task series
const TaskLineChart = ({ series, daysInLast30, colorPalette }) => {
  const theme = useTheme();
  return (
    <LineChart
      colors={colorPalette}
      xAxis={[
        {
          scaleType: "point",
          data: series?.length > 0 ? daysInLast30 : [],
          tickInterval: (index, i) => (i + 1) % 5 === 0,
        },
      ]}
      series={series.map((item) => ({
        ...item,
        showMark: false,
        curve: "linear",
        stack: "total",
        area: true,
        stackOrder: "ascending",
      }))}
      height={250}
      margin={{ left: 0, right: 20, top: 20, bottom: 20 }}
      grid={{ horizontal: true }}
      sx={{
        "& .MuiAreaElement-series-completed": {
          fill: "url('#completed')",
        },
        "& .MuiAreaElement-series-in-progress": {
          fill: "url('#in-progress')",
        },
        "& .MuiAreaElement-series-pending": {
          fill: "url('#pending')",
        },
        "& .MuiAreaElement-series-to-do": {
          fill: "url('#to-do')",
        },
      }}
      slotProps={{
        legend: {
          hidden: true,
        },
      }}
    >
      <AreaGradient color={theme.palette.primary.dark} id="completed" />
      <AreaGradient color={theme.palette.primary.main} id="in-progress" />
      <AreaGradient color={theme.palette.primary.light} id="pending" />
      <AreaGradient color={theme.palette.primary.contrastText} id="to-do" />
    </LineChart>
  );
};

TaskLineChart.propTypes = {
  series: PropTypes.array.isRequired,
  daysInLast30: PropTypes.array.isRequired,
  colorPalette: PropTypes.array.isRequired,
};

const UserProfile = () => {
  const { userId } = useParams();
  const departmentId = useSelector(selectSelectedDepartmentId);
  const theme = useTheme();

  const colorPalette = [
    theme.palette.primary.contrastText,
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
  ];

  const {
    data = {},
    isError,
    error,
    isLoading,
    isFetching,
    isSuccess,
  } = useGetUserProfileQuery({
    departmentId,
    userId,
    currentDate: dayjs().format("YYYY-MM-DD"),
  });

  const { user } = data || {};

  const {
    fullName = "",
    position = "",
    email = "",
    department = {},
    profilePicture = "",
    assignedTaskCount = 0,
    routineTaskCount = 0,
    totalCompleted = 0,
    assignedSeries = [],
    routineSeries = [],
    daysInLast30 = [],
  } = user || {};

  if (isLoading) return <LoadingFallback />;
  if (isFetching) return <LoadingBackdrop open={isFetching} />;
  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container
      maxWidth="md"
      sx={{ pt: 2, px: { xs: 0.5, sm: 2 }, pb: { xs: 8, md: 2 } }}
    >
      {isSuccess && (
        <Grid container spacing={2}>
          {/* Profile Section */}
          <Grid size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ position: "relative" }}>
              <CardContent sx={{ position: "relative", minHeight: 120 }}>
                <Stack spacing={1}>
                  <Typography variant="h6" component="p">
                    {fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {position}
                  </Typography>
                  <Typography variant="body2">{email}</Typography>
                  <Typography variant="body2">
                    Department: {department.name}
                  </Typography>
                  <Typography variant="body2">
                    Total Completed: {totalCompleted}
                  </Typography>
                </Stack>
                {profilePicture && (
                  <Box
                    component="img"
                    src={profilePicture}
                    alt={fullName}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                      objectFit: "cover",
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Assigned Tasks Chart */}
          <Grid size={{ xs: 12, sm: 9, lg: 6 }} sx={{ mx: "auto" }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%" }}>
                <Typography component="h2" variant="subtitle2" gutterBottom>
                  Assigned Tasks
                </Typography>
                <Stack sx={{ justifyContent: "space-between" }}>
                  <Stack
                    direction="row"
                    sx={{
                      alignContent: { xs: "center", sm: "flex-start" },
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="h4" component="p">
                      {assignedTaskCount}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Number of tasks assigned per day for the last 30 days
                  </Typography>
                </Stack>
                <TaskLineChart
                  series={assignedSeries}
                  daysInLast30={daysInLast30}
                  colorPalette={colorPalette}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Routine Tasks Chart */}
          <Grid size={{ xs: 12, sm: 9, lg: 6 }} sx={{ mx: "auto" }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%" }}>
                <Typography component="h2" variant="subtitle2" gutterBottom>
                  Routine Tasks
                </Typography>
                <Stack sx={{ justifyContent: "space-between" }}>
                  <Stack
                    direction="row"
                    sx={{
                      alignContent: { xs: "center", sm: "flex-start" },
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Typography variant="h4" component="p">
                      {routineTaskCount}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    Number of routine tasks per day for the last 30 days
                  </Typography>
                </Stack>
                <TaskLineChart
                  series={routineSeries}
                  daysInLast30={daysInLast30}
                  colorPalette={colorPalette}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default UserProfile;
