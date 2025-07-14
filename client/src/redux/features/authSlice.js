import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axios from "axios";

const SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export const makeRequest = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
});

// Async thunks with proper error handling and toasts
export const setCredentials = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await makeRequest.post("/auth/login", userData);
      // toast.success("Login successful!", {
      //   position: "bottom-right",
      //   autoClose: 3000,
      // });
      return data;
    } catch (error) {
      // toast.error(error.response?.data?.message || "Login failed", {
      //   position: "bottom-right",
      //   autoClose: 5000,
      // });
      return rejectWithValue(error.response?.data);
    }
  }
);

export const setLogout = createAsyncThunk(
  "auth/logout",
  async (message, { rejectWithValue }) => {
    try {
      await makeRequest.post("/auth/logout");
      toast.success(message || "Logged out successfully", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return {};
    } catch (error) {
      toast.error("Failed to logout properly", {
        position: "bottom-right",
        autoClose: 5000,
      });
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  currentUser: null,
  selectedDepartmentId: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokenVersion: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSelectedDepartmentId: (state, action) => {
      // if (state.currentUser?.department?._id === action.payload) {
      //   state.selectedDepartmentId = action.payload;
      // }
      state.selectedDepartmentId = action.payload;
    },
    incrementTokenVersion: (state) => {
      state.tokenVersion += 1;
    },
    setProfilePicture: (state, action) => {
      if (state.currentUser) {
        state.currentUser.profilePicture = action.payload;
      }
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
        state.selectedDepartmentId =
          action.payload.user?.department?._id || null;
        state.isAuthenticated = true;
        state.tokenVersion = action.payload.user?.tokenVersion || 0;
      })
      .addCase(setCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.tokenVersion = 0;
      })
      .addCase(setLogout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setLogout.fulfilled, (state) => {
        state.isLoading = false;
        state.currentUser = null;
        state.selectedDepartmentId = null;
        state.isAuthenticated = false;
        state.tokenVersion = 0;
      })
      .addCase(setLogout.rejected, (state) => {
        state.isLoading = false;
        state.tokenVersion = 0;
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
export const selectTokenVersion = (state) => state.auth.tokenVersion;

export const {
  setSelectedDepartmentId,
  incrementTokenVersion,
  setProfilePicture,
} = authSlice.actions;

export default authSlice.reducer;
