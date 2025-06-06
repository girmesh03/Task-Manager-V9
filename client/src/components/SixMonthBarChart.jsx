import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
// import { useTheme } from "@mui/material/styles";

const SixMonthBarChart = ({ interval, seriesData, lastSixMonths }) => {
  // const theme = useTheme();
  // const colorPalette = [
  //   (theme.vars || theme).palette.primary.dark,
  //   (theme.vars || theme).palette.primary.main,
  //   (theme.vars || theme).palette.primary.light,
  //   (theme.vars || theme).palette.primary.contrastText,
  // ];

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Last 6 months
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {interval}
        </Typography>
        <BarChart
          borderRadius={8}
          // colors={colorPalette}
          xAxis={[
            {
              scaleType: "band",
              categoryGapRatio: 0.5,
              data: lastSixMonths,
            },
          ]}
          series={[
            {
              id: "completed",
              label: "Completed",
              data: seriesData.Completed,
              stack: "A",
            },
            {
              id: "in-progress",
              label: "In Progress",
              data: seriesData["In Progress"],
              stack: "A",
            },
            {
              id: "pending",
              label: "Pending",
              data: seriesData.Pending,
              stack: "A",
            },
            {
              id: "to-do",
              label: "To Do",
              data: seriesData["To Do"],
              stack: "A",
            },
          ]}
          height={210}
          margin={{ left: 0, right: 0, top: 20, bottom: 0 }}
          grid={{ horizontal: true }}
          hideLegend
        />
      </CardContent>
    </Card>
  );
};

SixMonthBarChart.propTypes = {
  interval: PropTypes.string.isRequired,
  seriesData: PropTypes.object.isRequired,
  lastSixMonths: PropTypes.array.isRequired,
};

export default SixMonthBarChart;
