import { memo } from "react";
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid";

import TaskCard from "./TaskCard";

const TaskList = memo(({ tasks, onEdit }) => {
  console.log("TaskList");
  return (
    <Grid container spacing={2}>
      {tasks.map((task) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={task._id}>
          <TaskCard task={task} onEdit={onEdit} />
        </Grid>
      ))}
    </Grid>
  );
});

TaskList.propTypes = {
  tasks: PropTypes.array.isRequired,
  onEdit: PropTypes.func,
};

export default TaskList;
