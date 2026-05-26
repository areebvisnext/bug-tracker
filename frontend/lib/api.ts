const API_BASE =
  typeof process.env.NEXT_PUBLIC_API_URL === "string"
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

export type UserRole = "Manager" | "QA" | "Developer";

export type LoginPayload = {
  email: string;
  password: string;
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

export async function logoutUser(accessToken: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
}
