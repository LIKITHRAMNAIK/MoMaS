import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/transactions', // ✅ CORRECT
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use((req) => {
  console.log("🚀 API REQUEST:", req.data);
  return req;
});

export default API;