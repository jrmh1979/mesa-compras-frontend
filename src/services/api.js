// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // ✅ NECESARIO para sesiones / cookies cruzadas
});

export default api;

