import { createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";

const initialState = {
  searchText: "",
  selectedDate: dayjs().format("YYYY-MM-DD"),
  taskCreatedAt: "",
};

const filtersSlice = createSlice({
  name: "filters",
  initialState,
  reducers: {
    setSearchText(state, action) {
      state.searchText = action.payload;
    },
    setSelectedDate(state, action) {
      state.selectedDate = action.payload;
      state.taskCreatedAt = action.payload;
    },
    clearFilters(state) {
      state.searchText = "";
      state.selectedDate = dayjs().format("YYYY-MM-DD");
      state.taskCreatedAt = "";
    },
  },
});

export const { setSearchText, setSelectedDate, clearFilters } =
  filtersSlice.actions;

export const selectFilters = (state) => state.filters;

// export default filtersSlice;
export default filtersSlice.reducer;
