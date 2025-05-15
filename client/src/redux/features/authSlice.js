import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export const makeRequest = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
});

// Async thunk for setting credentials (logging in)
export const setCredentials = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await makeRequest.post("/auth/login", userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Async thunk for logging out
export const setLogout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await makeRequest.post("/auth/logout");
      return data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  currentUser: null,
  selectedDepartmentId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSelectedDepartmentId: (state, action) => {
      state.selectedDepartmentId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setCredentials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.user;
        state.selectedDepartmentId = action.payload.user?.department?._id;
        state.isAuthenticated = true;
      })
      .addCase(setCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(setLogout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setLogout.fulfilled, (state) => {
        state.isLoading = false;
        state.currentUser = null;
        state.selectedDepartmentId = null;
        state.isAuthenticated = false;
      })
      .addCase(setLogout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectSelectedDepartmentId = (state) =>
  state.auth.selectedDepartmentId;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;

export const { setSelectedDepartmentId } = authSlice.actions;

export default authSlice.reducer;
