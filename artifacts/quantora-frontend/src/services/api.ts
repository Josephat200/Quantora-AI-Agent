export type ApiUser = { id: string; email: string; full_name: string; is_active: boolean };
export type ApiMessage = { id: string; role: "user" | "assistant"; content: string; created_at: string };
export type ApiConversation = { id: string; title: string; updated_at: string; messages: ApiMessage[] };
export type AuthResponse = { access_token: string; token_type: string; user: ApiUser };
export type UploadedFile = { file_id: string; filename: string; content_type: string; size: number };

const API_PREFIX = "/api/v1";

function token() {
  return localStorage.getItem("quantora-token");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const authToken = token();
  if (authToken) headers.set("authorization", `Bearer ${authToken}`);
  const response = await fetch(`${API_PREFIX}${path}`, { ...init, headers });
  const data = (await response.json().catch(() => null)) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data?.error?.message ?? `Request failed with HTTP ${response.status}.`);
  return data;
}

export const api = {
  register: (payload: { full_name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => request<ApiUser>("/auth/me"),
  conversations: () => request<ApiConversation[]>("/chat/conversations"),
  sendMessage: (payload: { message: string; conversation_id?: string; agent_type?: string }) =>
    request<{ message: string; conversation_id: string; model: string }>("/chat", { method: "POST", body: JSON.stringify(payload) }),
  upload: (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request<UploadedFile>("/files/upload", { method: "POST", body });
  },
  deleteFile: (id: string) => request<void>(`/files/${encodeURIComponent(id)}`, { method: "DELETE" }),
};