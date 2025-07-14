import { Navigate } from "react-router-dom";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { useSelector } from "react-redux";
import { useGetStatisticsQuery } from "../redux/features/statisticsApiSlice";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { selectFilters } from "../redux/features/filtersSlice";

import StatisticsCard from "../components/StatisticsCard";
import SixMonthBarChart from "../components/SixMonthBarChart";
import PerformancePieChart from "../components/PerformancePieChart";
import {
  LoadingBackdrop,
  LoadingFallback,
} from "../components/LoadingFallback";

const Dashboard = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const { data, isLoading, isFetching, isError, error } = useGetStatisticsQuery(
    {
      departmentId,
      currentDate: selectedDate,
    },
    { refetchOnMountOrArgChange: true }
  );

  const {
    taskStatistics = [],
    sixMonthStatistics = {},
    performanceChartData = {},
    daysInLast30,
  } = data || {};

  const {
    sixMonthSeries = {},
    lastSixMonths = [],
    interval = "",
  } = sixMonthStatistics || {};

  if (isLoading) return <LoadingFallback />;
  if (isFetching) return <LoadingBackdrop open={isFetching} />;
  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 }, my: 2 }}>
      <Typography component="h2" variant="h6">
        Overview
      </Typography>
      <Grid
        container
        spacing={2}
        columns={12}
        sx={(theme) => ({
          [theme.breakpoints.down("md")]: {
            mb: theme.spacing(8),
          },
        })}
      >
        {/* statistics cards */}
        {taskStatistics?.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatisticsCard {...card} daysInLast30={daysInLast30} />
          </Grid>
        ))}

        {/* six month barchart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <SixMonthBarChart
            interval={interval}
            seriesData={sixMonthSeries}
            lastSixMonths={lastSixMonths}
          />
        </Grid>

        {/* Department performance pie chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <PerformancePieChart performance={performanceChartData} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
