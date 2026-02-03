import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Make sure this matches your backend port
  withCredentials: true, // <--- CRITICAL: This sends the HttpOnly Cookie to the backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
