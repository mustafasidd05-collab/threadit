const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData))
    headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const authApi = {
  signup: (data: { username: string; email: string; password: string }) =>
    api<any>("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    api<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Users
export const usersApi = {
  me: () => api<any>("/users/me"),
  byUsername: (username: string) => api<any>(`/users/${username}`),
  userThreads: (username: string) => api<any[]>(`/users/${username}/threads`),
  updateProfile: (data: any) =>
    api<any>("/users/profile", { method: "PUT", body: JSON.stringify(data) }),
};

// Threads
export const threadsApi = {
  list: (skip = 0, limit = 20) =>
    api<any[]>(`/threads?skip=${skip}&limit=${limit}`),
  detail: (id: string) => api<any>(`/threads/${id}`),
  create: (data: {
    title: string;
    content: string;
    parent_thread_id?: string;
  }) => api<any>("/threads", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { title?: string; content?: string }) =>
    api<any>(`/threads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => api<void>(`/threads/${id}`, { method: "DELETE" }),
  vote: (id: string, value: number) =>
    api<any>(`/threads/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ value }),
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
