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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AUTH
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CAPITAL SEEKER
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const seekerAPI = {
  getProfile: () => api.get("/capital-seeker/profile"),

  saveProfile: (d) => api.put("/capital-seeker/profile", d),

  getDashboard: () => api.get("/capital-seeker/dashboard"),

  getPendingCount: () => api.get("/capital-seeker/pending-count"),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// LISTINGS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INVESTOR
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const investorAPI = {
  getProfile: () => api.get("/investor/profile"),

  saveProfile: (d) => api.put("/investor/profile", d),

  getDashboard: () => api.get("/investor/dashboard"),

  save: (id) => api.post("/investor/save", { startup_id: id }),

  getSaved: () => api.get("/investor/saved"),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INTERESTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const interestAPI = {
  send: (d) => api.post("/interest/send", d),

  mine: () => api.get("/interest/mine"),

  forStartup: (id) => api.get(`/interest/startup/${id}`),

  updateStatus: (id, status) => api.put(`/interest/${id}/status`, { status }),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DOCUMENTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// UPDATES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const updateAPI = {
  post: (d) => api.post("/update", d),

  forStartup: (id) => api.get(`/update/startup/${id}`),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// CONNECTIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MESSAGES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// NOTIFICATIONS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ACTIVITY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const activityAPI = {
  track: (listingId, type, sector) =>
    api.post("/activity", {
      listing_id: listingId,
      type,
      sector,
    }),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ACCESS LOGS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const accessLogAPI = {
  getLogs: (startup_id) => api.get(`/document/access-logs/${startup_id}`),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SCORING & REPORTS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const scoreAPI = {
  getScore: (id) => api.get(`/score/listing/${id}/score`),

  getReport: (id) => api.get(`/score/listing/${id}/report`),

  getPublicScore: (id) => api.get(`/score/public/${id}`),
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ADMIN
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DUE DILIGENCE
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const dueDiligenceAPI = {
  getByConnection: (connectionId) =>
    api.get(`/due-diligence/connection/${connectionId}`),

  getSummary: (dueDiligenceId) =>
    api.get(`/due-diligence/${dueDiligenceId}/summary`),

  getCategories: (dueDiligenceId) =>
    api.get(`/due-diligence/${dueDiligenceId}/categories`),

  recalculate: (dueDiligenceId) =>
    api.post(`/due-diligence/${dueDiligenceId}/recalculate`),
};
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PORTFOLIO
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const portfolioAPI = {
  getAll: () => api.get("/portfolio"),

  getSummary: () => api.get("/portfolio/summary"),

  getOne: (id) => api.get(`/portfolio/${id}`),

  getWorkspace: (id) => api.get(`/portfolio/${id}/workspace`),

  create: (payload) => api.post("/portfolio", payload),

  createExternal: (payload) => api.post("/portfolio/external", payload),

  update: (id, payload) => api.put(`/portfolio/${id}`, payload),

  remove: (id) => api.delete(`/portfolio/${id}`),

  getDocuments: (id) => api.get(`/portfolio/${id}/documents`),

  addDocument: (id, payload) =>
    api.post(`/portfolio/${id}/documents`, payload),

  removeDocument: (id, documentId) =>
    api.delete(`/portfolio/${id}/documents/${documentId}`),

  getMilestones: (id) => api.get(`/portfolio/${id}/milestones`),

  createMilestone: (id, payload) =>
    api.post(`/portfolio/${id}/milestones`, payload),

  updateMilestone: (id, milestoneId, payload) =>
    api.put(`/portfolio/${id}/milestones/${milestoneId}`, payload),

  removeMilestone: (id, milestoneId) =>
    api.delete(`/portfolio/${id}/milestones/${milestoneId}`),

  getMessages: (id) => api.get(`/portfolio/${id}/messages`),

  sendMessage: (id, message) =>
    api.post(`/portfolio/${id}/messages`, { message }),
};
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SECONDARY OPPORTUNITIES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const secondaryOpportunityAPI = {
  getLive: () => api.get("/secondary-opportunities"),
  expressInterest: (id, message) =>
    api.post(`/secondary-opportunities/${id}/interest`, {
      message,
    }),
  getInterests: (id) => api.get(`/secondary-opportunities/${id}/interests`),
  approveInterest: (opportunityId, interestId) =>
    api.post(
      `/secondary-opportunities/${opportunityId}/interests/${interestId}/approve`,
    ),

  declineInterest: (opportunityId, interestId) =>
    api.post(
      `/secondary-opportunities/${opportunityId}/interests/${interestId}/decline`,
    ),
  create: (payload) => api.post("/secondary-opportunities", payload),

  getMy: () => api.get("/secondary-opportunities/my"),

  submit: (id) => api.post(`/secondary-opportunities/${id}/submit`),

  getPending: () => api.get("/secondary-opportunities/admin/pending"),

  approve: (id) => api.post(`/secondary-opportunities/${id}/approve`),

  reject: (id, rejection_reason) =>
    api.post(`/secondary-opportunities/${id}/reject`, {
      rejection_reason,
    }),
};
export const secondaryDealAPI = {
  getMy: () => api.get("/secondary-deals/my"),

  getById: (id) => api.get(`/secondary-deals/${id}`),

  getMessages: (id) => api.get(`/secondary-deals/${id}/messages`),

  sendMessage: (id, message) =>
    api.post(`/secondary-deals/${id}/messages`, {
      message,
    }),

  updateStatus: (id, status) =>
    api.patch(`/secondary-deals/${id}/status`, {
      status,
    }),

  // Secondary deal documents
  getDocuments: (id) => api.get(`/secondary-deals/${id}/documents`),

  uploadDocument: (id, formData) =>
    api.post(`/secondary-deals/${id}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // Secondary deal document requests
  getDocumentRequests: (id) =>
    api.get(`/secondary-deals/${id}/document-requests`),

  requestDocument: (id, payload) =>
    api.post(`/secondary-deals/${id}/document-requests`, payload),

  fulfillDocumentRequest: (id, requestId, formData) =>
    api.patch(
      `/secondary-deals/${id}/document-requests/${requestId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    ),
};
export default api;

