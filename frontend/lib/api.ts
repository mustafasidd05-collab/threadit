const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";

  let res = await fetch(`${BASE}${path}`, { ...options, headers });

  // If 401, try to refresh token and retry once
  if (res.status === 401 && getRefreshToken()) {
    // Prevent multiple simultaneous refreshes
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken();
    }
    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${BASE}${path}`, { ...options, headers });
    }
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export { setTokens, clearTokens, getAccessToken };

// Auth
export const authApi = {
  signup: (data: { username: string; email: string; password: string }) =>
    api<any>("/auth/signup", {
      method: "POST", body: JSON.stringify(data),
    }),
  verifyOtp: (data: { email: string; otp: string }) =>
    api<{ message: string; email: string }>("/auth/verify-otp", {
      method: "POST", body: JSON.stringify(data),
    }),
  resendOtp: (data: { username: string; email: string; password: string }) =>
    api<any>("/auth/resend-otp", {
      method: "POST", body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    api<{ access_token: string; refresh_token: string }>("/auth/login", {
      method: "POST", body: JSON.stringify(data),
    }),
};

// Users
export const usersApi = {
  me: () => api<any>("/auth/me"),
  byUsername: (username: string) => api<any>(`/users/${username}`),
  userThreads: (username: string) => api<any[]>(`/users/${username}/threads`),
  updateProfile: (data: any) =>
    api<any>("/users/profile", { method: "PUT", body: JSON.stringify(data) }),
};

// Threads
export const threadsApi = {
  list: (skip = 0, limit = 20, tribeId?: string) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (tribeId) params.set("tribe_id", tribeId);
    return api<any[]>(`/threads?${params}`);
  },
  detail: (id: string) => api<any>(`/threads/${id}`),
  create: (data: { title: string; content: string; parent_thread_id?: string; tribe_id?: string }) =>
    api<any>("/threads", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; content?: string }) =>
    api<any>(`/threads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    api<any>(`/threads/${id}`, { method: "DELETE" }),
  vote: (id: string, value: number) =>
    api<any>(`/threads/${id}/vote`, {
      method: "POST", body: JSON.stringify({ value }),
    }),
};

// Chat
export const chatApi = {
  conversations: () => api<any[]>("/chat/conversations"),
  messages: (otherUserId: string, limit = 50) =>
    api<any[]>(`/chat/messages/${otherUserId}?limit=${limit}`),
};

// Files
export const filesApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api<any>("/files/upload", { method: "POST", body: form });
  },
};

// Search
export const searchApi = {
  search: (q: string) =>
    api<any>(`/search?q=${encodeURIComponent(q)}`),
};

// Tribes
export const tribesApi = {
  list: () => api<any[]>("/tribes"),
  detail: (name: string) => api<any>(`/tribes/${name}`),
  threads: (name: string, skip = 0, limit = 20) =>
    api<any[]>(`/tribes/${name}/threads?skip=${skip}&limit=${limit}`),
  create: (data: { name: string; description: string }) =>
    api<any>("/tribes", { method: "POST", body: JSON.stringify(data) }),
  join: (tribeId: string) =>
    api<any>(`/tribes/${tribeId}/join`, { method: "POST" }),
  leave: (tribeId: string) =>
    api<any>(`/tribes/${tribeId}/leave`, { method: "POST" }),
};
