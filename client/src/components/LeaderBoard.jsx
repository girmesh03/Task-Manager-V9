import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

const LeaderBoard = ({ leaderBoardData }) => {
  const hasData = Array.isArray(leaderBoardData) && leaderBoardData.length > 0;
  return (
    <Card variant="outlined" sx={{ width: "100%", height: "100%" }}>
      <CardContent sx={{ height: "100%" }}>
        {hasData ? (
          <List
            dense
            sx={{
              "& .MuiRating-root": {
                "& .MuiRating-iconFilled": {
                  "& .MuiSvgIcon-root": {
                    color: "#FFD700", // gold
                  },
                },
                "& .MuiRating-iconEmpty": {
                  "& .MuiSvgIcon-root": {
                    color: "#e0e0e0", // light grey
                  },
                },
              },
            }}
          >
            {leaderBoardData.map((data, index) => (
              <ListItem key={index} disableGutters disablePadding>
                <ListItemAvatar>
                  <Avatar
                    src={data.user?.profilePicture?.url}
                    alt={data.user.fullName}
                  />
                </ListItemAvatar>

                <ListItemText
                  primary={data.user.fullName}
                  secondary={
                    <Rating
                      name={`leader-rating-${index}`}
                      value={data.rating || 0}
                      precision={0.5}
                      readOnly
                      size="small"
                      icon={<FavoriteIcon fontSize="inherit" />}
                      emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
                    />
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography
            variant="body1"
            align="center"
            color="textSecondary"
            sx={{ py: 4 }}
          >
            🎉 No one’s on the leaderboard yet — be the first to make your mark!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

LeaderBoard.propTypes = {
  leaderBoardData: PropTypes.arrayOf(
    PropTypes.shape({
      user: PropTypes.shape({
        fullName: PropTypes.string.isRequired,
        profilePicture: PropTypes.shape({ url: PropTypes.string }),
      }).isRequired,
      rating: PropTypes.number,
    })
  ).isRequired,
};

export default LeaderBoard;
