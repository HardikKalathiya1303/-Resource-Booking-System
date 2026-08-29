import axios from 'axios';

// Base URL is set via VITE_API_URL env variable.
// Local dev: http://localhost:3000
// Docker:    http://localhost:3000 (same, backend mapped to host port 3000)
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
