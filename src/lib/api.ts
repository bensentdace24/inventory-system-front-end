import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api", // Points to your Laravel backend
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
