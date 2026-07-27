import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://kuberlist-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  return cfg;
});

api.interceptors.response.use(
  (res) => res,

  async (err) => {
    const orig = err.config;

    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;

      const rt = localStorage.getItem("refreshToken");

      if (rt) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: rt,
          });

          localStorage.setItem("accessToken", data.data.accessToken);

          localStorage.setItem("refreshToken", data.data.refreshToken);

          orig.headers.Authorization = `Bearer ${data.data.accessToken}`;

          return api(orig);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(err);
  },
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const authAPI = {
  register: (d) => api.post("/auth/register", d),

  login: (d) => api.post("/auth/login", d),

  refresh: (rt) => api.post("/auth/refresh", { refreshToken: rt }),

  logout: (rt) => api.post("/auth/logout", { refreshToken: rt }),

  me: () => api.get("/auth/me"),
};
export const userAPI = {
  uploadProfileImage: (formData) =>
    api.post("/user/profile-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
// ─────────────────────────────────────────────
// CAPITAL SEEKER
// ─────────────────────────────────────────────

export const seekerAPI = {
  getProfile: () => api.get("/capital-seeker/profile"),

  saveProfile: (d) => api.put("/capital-seeker/profile", d),

  getDashboard: () => api.get("/capital-seeker/dashboard"),

  getPendingCount: () => api.get("/capital-seeker/pending-count"),
};

// ─────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────

export const listingAPI = {
  create: (d) => api.post("/listings/my", d),

  getAll: () => api.get("/listings/my"),

  getOne: (id) => api.get(`/listings/my/${id}`),

  update: (id, d) => api.put(`/listings/my/${id}`, d),

  delete: (id) => api.delete(`/listings/my/${id}`),

  submit: (id) => api.post(`/listings/my/${id}/submit`),

  browse: (p) => api.get("/listings", { params: p }),

  getPublic: (id) => api.get(`/listings/${id}`),
};

// ─────────────────────────────────────────────
// INVESTOR
// ─────────────────────────────────────────────

export const investorAPI = {
  getProfile: () => api.get("/investor/profile"),

  saveProfile: (d) => api.put("/investor/profile", d),

  getDashboard: () => api.get("/investor/dashboard"),

  save: (id) => api.post("/investor/save", { startup_id: id }),

  getSaved: () => api.get("/investor/saved"),
};

// ─────────────────────────────────────────────
// INTERESTS
// ─────────────────────────────────────────────

export const interestAPI = {
  send: (d) => api.post("/interest/send", d),

  mine: () => api.get("/interest/mine"),

  forStartup: (id) => api.get(`/interest/startup/${id}`),

  updateStatus: (id, status) => api.put(`/interest/${id}/status`, { status }),
};

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────

export const documentAPI = {
  upload: (formData) =>
    api.post(
      "/document/upload",

      formData,

      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),

  list: (startupId) => api.get(`/document/startup/${startupId}`),

  delete: (id) => api.delete(`/document/${id}`),

  verify: (id, data) => api.patch(`/document/${id}/verify`, data),

  adminAll: () => api.get("/document/admin/all"),
  download: async (id) => {
    const { data } = await api.get(`/document/${id}/download`);

    window.open(data.download_url, "_blank");
  },
};

// ─────────────────────────────────────────────
// UPDATES
// ─────────────────────────────────────────────

export const updateAPI = {
  post: (d) => api.post("/update", d),

  forStartup: (id) => api.get(`/update/startup/${id}`),
};

// ─────────────────────────────────────────────
// CONNECTIONS
// ─────────────────────────────────────────────

export const connectionAPI = {
  getMyConnections: (userId) => api.get(`/connections/user/${userId}`),

  getConnection: (id) => api.get(`/connections/${id}`),

  updateStage: (id, payload) => api.patch(`/connections/${id}/stage`, payload),
  getSharedDocuments: (id) => api.get(`/connections/${id}/documents`),
  uploadNDA: (id, formData) =>
    api.post(`/connections/${id}/nda`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  overrideNDA: (id) => api.patch(`/connections/${id}/nda/override`),
};
// ─────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────

export const messageAPI = {
  send: (connection_id, message, attachments) =>
    api.post("/messages", {
      connection_id,
      message,
      attachments,
    }),

  getMessages: (connection_id, page = 1) =>
    api.get(
      `/messages/${connection_id}`,

      {
        params: {
          page,
          limit: 50,
        },
      },
    ),

  getUnreadCount: () => api.get("/messages/unread-count"),
};

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const notificationAPI = {
  getAll: (page = 1) =>
    api.get(
      "/notifications",

      {
        params: { page },
      },
    ),

  getUnread: () => api.get("/notifications/unread-count"),

  markRead: (ids = []) =>
    api.post(
      "/notifications/mark-read",

      { ids },
    ),
};

// ─────────────────────────────────────────────
// ACTIVITY
// ─────────────────────────────────────────────

export const activityAPI = {
  track: (listingId, type, sector) =>
    api.post("/activity", {
      listing_id: listingId,
      type,
      sector,
    }),
};

// ─────────────────────────────────────────────
// ACCESS LOGS
// ─────────────────────────────────────────────

export const accessLogAPI = {
  getLogs: (startup_id) => api.get(`/document/access-logs/${startup_id}`),
};

// ─────────────────────────────────────────────
// SCORING & REPORTS
// ─────────────────────────────────────────────

export const scoreAPI = {
  getScore: (id) => api.get(`/score/listing/${id}/score`),

  getReport: (id) => api.get(`/score/listing/${id}/report`),

  getPublicScore: (id) => api.get(`/score/public/${id}`),
};

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

export const adminAPI = {
  metrics: () => api.get("/admin/metrics"),

  users: (p) => api.get("/admin/users", { params: p }),

  listings: (p) => api.get("/admin/listings", { params: p }),

  review: (id, status, rejection_reason) =>
    api.patch(
      `/admin/listings/${id}/review`,

      {
        status,
        rejection_reason,
      },
    ),

  interests: () => api.get("/admin/interests"),
};

export const diligenceAPI = {
  create: (payload) => api.post("/diligence/request", payload),

  list: (startupId) => api.get(`/diligence/startup/${startupId}`),

  respond: (id, payload) => api.patch(`/diligence/${id}/respond`, payload),

  complete: (id) => api.patch(`/diligence/${id}/complete`),
};

export default api;
