const USER_PROFILE_KEY = "user_profile";

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
  logo?: File | null;
};

export type ProjectResponse = {
  id: number;
  name: string;
  description: string | null;
  logo?: string | null;
  created_by: UserProfile;
  created_at: string;
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

export type BugResponse = {
  id: number;
  title: string;
  description: string | null;
  type: "bug" | "feature";
  status: "new" | "started" | "completed" | "resolved";
  deadline: string | null;
  screenshot?: string | null;
  project_id: number;
  assigned_to: string;
  created_by: string;
  created_at: string;
};

export type BugPayload = {
  title: string;
  description?: string | null;
  type: "bug" | "feature";
  status: "new" | "started" | "completed" | "resolved";
  deadline?: string | null;
  project_id: number;
  assigned_to: string;
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
    return "Error occured during error parse"
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
  localStorage.removeItem(USER_PROFILE_KEY);
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

  const cached = localStorage.getItem(USER_PROFILE_KEY);
  if (cached) return JSON.parse(cached) as UserProfile;

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: authHeaders(accessToken),
  });

  if (!res.ok) throw new Error(await parseError(res));

  const user: UserProfile = await res.json();
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
  return user;
}


export async function logoutUser(accessToken: string | null): Promise<void> {

  const res = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });

  if (!res.ok) throw new Error(await parseError(res));
  localStorage.removeItem(USER_PROFILE_KEY);
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
  payload: ProjectPayload,
  access_token:string | null
): Promise<ProjectResponse> {

  const formData = new FormData();
  formData.append("name", payload.name);
  if (payload.description) formData.append("description", payload.description);
  if (payload.logo) formData.append("logo_file", payload.logo);

  const res = await fetch(`${API_BASE}/api/projects/upload`, {
    method: "POST",
    headers: authHeaders(access_token),
    body: formData,
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function GetDevs(accessToken: string): Promise<any[]> {

  const res = await fetch(`${API_BASE}/api/auth/devs`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(await parseError(res));
  }

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


export async function GetBugs(accessToken: string): Promise<BugResponse[]> {

  const res = await fetch(`${API_BASE}/api/bugs/`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(await parseError(res));
  }
  return res.json();
}

export async function CreateBug(
  payload: BugPayload,
  access_token: string | null
): Promise<BugResponse> {

  const res = await fetch(`${API_BASE}/api/bugs/`, {
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

export async function GetBug(
  bugId: number,
  accessToken: string
): Promise<BugResponse> {

  const res = await fetch(`${API_BASE}/api/bugs/${bugId}`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function UpdateBug(
  bugId: number,
  payload: Partial<BugPayload>,
  access_token: string | null
): Promise<string> {

  const res = await fetch(`${API_BASE}/api/bugs/${bugId}`, {
    method: "PUT",
    headers: {
      ...authHeaders(access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.text();
}

export async function UploadBugScreenshot(
  bugId: number,
  file: File,
  access_token: string | null
): Promise<void> {

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/bugs/${bugId}/screenshot`, {
    method: "POST",
    headers: authHeaders(access_token),
    body: formData,
  });
  
  if (!res.ok) throw new Error(await parseError(res));
}

export async function UpdateProject(
  projectId: number,
  payload: Partial<ProjectPayload>,
  access_token: string | null
): Promise<ProjectResponse> {

  const formData = new FormData();
  if (payload.name) formData.append("name", payload.name);
  if (payload.description) formData.append("description", payload.description);
  if (payload.logo) formData.append("logo_file", payload.logo);

  const res = await fetch(`${API_BASE}/api/projects/${projectId}/upload`, {
    method: "PUT",
    headers: authHeaders(access_token),
    body: formData,
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function AddMembersToProject(
  projectId: number,
  userId: string,
  access_token: string | null
): Promise<any> {

  const res = await fetch(`${API_BASE}/api/projects/${projectId}/members`, {
    method: "POST",
    headers: {
      ...authHeaders(access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function GetProjectMembers(accessToken: string | null, project_id:number): Promise<any[]> {

  const res = await fetch(`${API_BASE}/api/projects/${project_id}/members`, {
    method: "GET",
    headers: authHeaders(accessToken),
  });

  if (!res.ok) throw new Error(await parseError(res));
  console.log(res);
  return res.json();
}

export async function RemoveProjectMember(
  token: string | null,
  projectId: number,
  userId: string
): Promise<void> {

  const res = await fetch(`${API_BASE}/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to remove member ${userId}`);
  }
}

export async function DeleteBug(bugId:number, token:string | null):Promise<void> {

  const res = await fetch(`${API_BASE}/api/bugs/${bugId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to remove delete ${bugId}`);
  }
}