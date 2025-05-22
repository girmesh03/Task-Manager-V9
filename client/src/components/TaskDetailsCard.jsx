import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";

import useExpandableText from "../hooks/useExpandableText";

const TaskDetailsCard = ({ task }) => {
  const { displayText, isTruncated, expanded, toggleExpand } =
    useExpandableText(task?.description, 100);

  return (
    <Card
      variant="outlined"
      sx={{ maxWidth: 700, mx: "auto", p: { xs: 1, sm: 2, md: 3 } }}
    >
      <CardContent>
        {/* Title */}
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {task.status}
        </Typography>

        {task.description && (
          <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
            {displayText}{" "}
            {isTruncated && (
              <Link
                component="button"
                variant="body2"
                onClick={toggleExpand}
                underline="hover"
              >
                {expanded ? "Show less" : "Read more"}
              </Link>
            )}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

TaskDetailsCard.propTypes = {
  task: PropTypes.object.isRequired,
};

export default TaskDetailsCard;
