const API_BASE =
  import.meta.env.VITE_API_URL || "https://kuberlist-backend.onrender.com/api";

export const BACKEND_URL = API_BASE.replace("/api", "");

export const imageUrl = (path) => {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  return `${BACKEND_URL}${path}`;
};
