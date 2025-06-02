import { memo } from "react";
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid2";

import RoutineTaskCard from "./RoutineTaskCard";

const RoutineTaskList = memo(({ tasks, onEdit }) => {
  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task._id}>
          <RoutineTaskCard task={task} onEdit={onEdit} />
        </Grid>
      ))}
    </Grid>
  );
});

RoutineTaskList.propTypes = {
  tasks: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default RoutineTaskList;
