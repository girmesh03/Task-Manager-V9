import { Navigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Avatar from "@mui/material/Avatar";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { useGetRoutineTaskQuery } from "../redux/features/routineTaskApiSlice";

import { LoadingFallback } from "../components/LoadingFallback";

const RoutineTaskDetails = () => {
  const { taskId } = useParams();
  const departmentId = useSelector(selectSelectedDepartmentId);

  const { data, isLoading, isError, error, isFetching } =
    useGetRoutineTaskQuery({ departmentId, taskId });

  const task = data?.task || {};

  if (isLoading || isFetching) return <LoadingFallback />;
  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Box sx={{ mb: { xs: 8, md: 0 }, flexGrow: 1, overflow: "auto", px: 1 }}>
      <Card
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 700,
          mx: "auto",
          my: 1,
          p: { xs: 1, sm: 2, md: 3 },
        }}
      >
        <CardHeader
          avatar={
            <Avatar src={task.performedBy?.profilePicture?.url}>
              {task.performedBy?.fullName?.[0]}
            </Avatar>
          }
          title={task.performedBy.fullName}
          subheader={task.performedBy.position}
        />

        <CardContent>
          <Divider textAlign="left" sx={{ my: 2 }}>
            <Typography variant="caption">
              Performed On – {dayjs(task.date).format("MMMM DD, YYYY")}
            </Typography>
          </Divider>

          {task.performedTasks.map((item, index) => (
            <Stack key={item._id} spacing={1} sx={{ mb: 1 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems="flex-start"
                spacing={1}
              >
                <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">–</Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      wordBreak: "break-word",
                      textAlign: { xs: "left", sm: "justify" },
                    }}
                  >
                    {item.description}
                  </Typography>
                </Stack>
                <Chip
                  label={item.isCompleted ? "Completed" : "In Progress"}
                  color={item.isCompleted ? "success" : "warning"}
                  size="small"
                  sx={{ maxWidth: 100, fontWeight: 600 }}
                />
              </Stack>

              {task.performedTasks.length - 1 !== index && <Divider />}
            </Stack>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RoutineTaskDetails;
