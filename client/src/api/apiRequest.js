import axios from "axios";

const SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export const makeRequest = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true,
});
