import { useState } from "react";
import { useDispatch } from "react-redux";
import { setSearchText, clearFilters } from "../redux/features/filtersSlice";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearIcon from "@mui/icons-material/Clear"; // Import Clear icon

const Search = () => {
  const [searchValue, setSearchValue] = useState("");
  const dispatch = useDispatch();

  const handleChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      const newValue = searchValue.trim().replace(/" "/g, "");
      dispatch(setSearchText(newValue));
      // setSearchValue(""); // Clear search value after submitting
    }
  };

  const handleClear = () => {
    setSearchValue(""); // Clear the input field
    dispatch(clearFilters()); // Reset the filters in the Redux store
  };

  return (
    <FormControl sx={{ width: { xs: "100%", md: "25ch" } }} variant="outlined">
      <OutlinedInput
        value={searchValue}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        size="small"
        id="search"
        placeholder="Search…"
        sx={{ flexGrow: 1 }}
        startAdornment={
          <InputAdornment position="start" sx={{ color: "text.primary" }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        endAdornment={
          searchValue && (
            <InputAdornment position="end">
              <ClearIcon
                fontSize="small"
                onClick={handleClear}
                sx={{ cursor: "pointer" }}
              />
            </InputAdornment>
          )
        }
        inputProps={{
          "aria-label": "search",
        }}
      />
    </FormControl>
  );
};

export default Search;
