import { api } from "./client";

export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  updateMe: (data) => api.put("/api/auth/me", data),
  deleteMe: () => api.del("/api/auth/me"),
};

export const transactionsApi = {
  // params: { date } or { month } or { from, to }, plus optional { type, category }
  list: (params) => api.get("/api/transactions", params),
  create: (data) => api.post("/api/transactions", data),
  update: (id, data) => api.put(`/api/transactions/${id}`, data),
  remove: (id) => api.del(`/api/transactions/${id}`),
};

export const analyticsApi = {
  summary: (date) => api.get("/api/analytics/summary", { date }),
};