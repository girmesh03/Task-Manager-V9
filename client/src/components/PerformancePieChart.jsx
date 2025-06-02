import PropTypes from "prop-types";

import { PieChart } from "@mui/x-charts/PieChart";
import { useTheme } from "@mui/material/styles";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { useMediaQuery } from "@mui/material";

const PerformancePieChart = ({ performance }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { breakdown, alert, performanceScore, interval } = performance;

  // Get alert color based on status
  const getAlertColor = () => {
    const alertLower = alert.toLowerCase();
    if (alertLower.includes("critical")) return "error";
    if (alertLower.includes("warning")) return "warning";
    if (alertLower.includes("good")) return "success";
    if (alertLower.includes("no data")) return "info";
    return "info";
  };

  // Check if we have data to display
  const hasData =
    performance.totalTasks > 0 && performance.breakdown.length > 0;

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Performance
          </Typography>
          {hasData && (
            <Typography variant="body2">{`${performanceScore}%`}</Typography>
          )}
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {interval}
          </Typography>
          <Chip size="small" color={getAlertColor()} label={alert} />
        </Stack>

        {hasData ? (
          <PieChart
            series={[
              {
                data: breakdown.map((item) => ({
                  id: item._id,
                  label: item._id.replace("Task", " Task"),
                  value: item.totalTasks,
                  completed: item.completedTasks,
                })),
                innerRadius: 30,
                outerRadius: 100,
                paddingAngle: 2,
                cornerRadius: 5,
                arcLabel: (item) => `${item.value}`,
                arcLabelMinAngle: 15,
                highlightScope: { faded: "global", highlighted: "item" },
                faded: {
                  innerRadius: 30,
                  additionalRadius: -10,
                  color: "gray",
                },
              },
            ]}
            // width={300}
            height={250}
            sx={{ flexGrow: 1 }}
            slotProps={{
              legend: {
                direction: isMobile ? "horizontal" : "vertical",
                position: {
                  vertical: isMobile ? "bottom" : "center",
                  horizontal: "middle",
                },
                padding: 0,
              },
            }}
          />
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">
              No task data available to display chart
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

PerformancePieChart.propTypes = {
  performance: PropTypes.object.isRequired,
};

export default PerformancePieChart;
