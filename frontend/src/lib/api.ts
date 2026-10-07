import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("legacyvault_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("legacyvault_token");
      localStorage.removeItem("legacyvault_user");
      // Redirect to login
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      "Đã có lỗi xảy ra. Vui lòng thử lại.";
    return Promise.reject(new Error(message));
  }
);

// ─── Auth API ──────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  }) => api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data: { name?: string; phone?: string; nationalId?: string }) =>
    api.put("/auth/me", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", data),
  forgotPassword: (data: { email: string }) => 
    api.post("/auth/forgot-password", data),
  resetPassword: (data: { token: string; newPassword: string }) => 
    api.post("/auth/reset-password", data),
};

// ─── Vault API ─────────────────────────────────────────────────────
export const vaultApi = {
  list: () => api.get("/vaults"),
  create: (data: {
    vaultName: string;
    masterKeySalt: string;
    encryptedMasterKey: string;
    description?: string;
  }) => api.post("/vaults", data),
  get: (id: string) => api.get(`/vaults/${id}`),
  update: (id: string, data: { vaultName?: string; description?: string }) =>
    api.put(`/vaults/${id}`, data),
  delete: (id: string) => api.delete(`/vaults/${id}`),
  getStats: (id: string) => api.get(`/vaults/${id}/stats`),
  assignExecutor: (id: string, executorEmail: string) =>
    api.post(`/vaults/${id}/executors`, { executorEmail }),
  revokeExecutor: (id: string, executorId: string) =>
    api.delete(`/vaults/${id}/executors/${executorId}`),
};

// ─── Asset API ─────────────────────────────────────────────────────
export const assetApi = {
  list: (vaultId: string) => api.get(`/vaults/${vaultId}/assets`),
  create: (vaultId: string, formData: FormData) =>
    api.post(`/vaults/${vaultId}/assets`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  get: (vaultId: string, id: string) => api.get(`/vaults/${vaultId}/assets/${id}`),
  update: (vaultId: string, id: string, data: object) =>
    api.put(`/vaults/${vaultId}/assets/${id}`, data),
  delete: (vaultId: string, id: string) =>
    api.delete(`/vaults/${vaultId}/assets/${id}`),
};

// ─── DMS API ───────────────────────────────────────────────────────
export const dmsApi = {
  getConfig: (vaultId: string) => api.get(`/vaults/${vaultId}/dms`),
  updateConfig: (
    vaultId: string,
    data: {
      checkIntervalDays?: number;
      gracePeriodDays?: number;
      notificationChannels?: { email: boolean; sms: boolean };
      isEnabled?: boolean;
    }
  ) => api.put(`/vaults/${vaultId}/dms`, data),
  checkin: (vaultId: string) => api.post(`/vaults/${vaultId}/checkin`),
};

// ─── Executor API ──────────────────────────────────────────────────
export const executorApi = {
  getAssignments: () => api.get("/executor/assignments"),
  getVaultAssets: (vaultId: string) => api.get(`/executor/vaults/${vaultId}/assets`),
  submitVerification: (vaultId: string, formData: FormData) =>
    api.post(`/executor/vaults/${vaultId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getProgress: (vaultId: string) => api.get(`/executor/vaults/${vaultId}/progress`),
};

// ─── Verifier API ──────────────────────────────────────────────────
export const verifierApi = {
  getRequests: () => api.get("/verifier/requests"),
  takeRequest: (id: string) => api.post(`/verifier/requests/${id}/take`),
  approveRequest: (id: string, notes?: string) =>
    api.post(`/verifier/requests/${id}/approve`, { notes }),
  rejectRequest: (id: string, reason: string) =>
    api.post(`/verifier/requests/${id}/reject`, { reason }),
  getHistory: (page?: number) =>
    api.get(`/verifier/history?page=${page || 1}`),
};

// ─── Beneficiary API ───────────────────────────────────────────────
export const beneficiaryApi = {
  getAssets: () => api.get("/beneficiary/assets"),
  submitKYC: (id: string, formData: FormData) =>
    api.post(`/beneficiary/assets/${id}/kyc`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  claimAsset: (id: string) => api.get(`/beneficiary/assets/${id}/claim`),
  confirmAsset: (id: string) => api.post(`/beneficiary/assets/${id}/confirm`),
};

// ─── Admin API ─────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  listUsers: (params?: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
  }) => api.get("/admin/users", { params }),
  createUser: (data: object) => api.post("/admin/users", data),
  updateUser: (id: string, data: object) => api.put(`/admin/users/${id}`, data),
  lockUser: (id: string) => api.post(`/admin/users/${id}/lock`),
  unlockUser: (id: string) => api.post(`/admin/users/${id}/unlock`),
  getAuditLogs: (params?: object) => api.get("/admin/audit", { params }),
  getConfig: () => api.get("/admin/config"),
};

export default api;
