const API_BASE =
  typeof process.env.NEXT_PUBLIC_API_URL === "string"
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

export type UserRole = "Manager" | "QA" | "Developer";

export type LoginPayload = {
  email: string;
  password: string;
};

export type ProjectPayload = {
  name: string;
  description: string;
};

export type SignupPayload = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: Record<string, unknown> | null;
};

export type UserProfile = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string;
  role: string;
  username: string;
  avatar_url: string | null;
};

function authHeaders(accessToken: string | null): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg).join(", ");
    }
  } catch {
    /* ignore */
  }
  return res.statusText || "Something went wrong";
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function signupUser(
  payload: SignupPayload,
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function getCurrentUser(accessToken: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function logoutUser(accessToken: string): Promise<void> {
  console.log(API_BASE)
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export async function GetProjects(accessToken: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/projects/`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function CreateProject(
  payload: ProjectPayload, access_token:string | null
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: {
      ...authHeaders(access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}


export async function GetDevs(accessToken: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/auth/devs`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function GetQA(accessToken: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/auth/qa`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}