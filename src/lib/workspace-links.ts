export interface WorkspaceLink {
  owner: string;
  repo: string;
  branch?: string;
  file?: string;
  pr?: number;
}

function workspaceParams({ branch, file, pr }: WorkspaceLink) {
  const params = new URLSearchParams();
  if (branch) params.set("branch", branch);
  if (file) params.set("file", file);
  if (pr) params.set("pr", String(pr));
  return params;
}

export function dashboardPath(link: WorkspaceLink) {
  const params = workspaceParams(link);
  params.set("repo", `${link.owner}/${link.repo}`);
  return `/dashboard?${params}`;
}

export function publicSharePath(link: WorkspaceLink) {
  const params = workspaceParams(link);
  const query = params.size ? `?${params}` : "";
  return `/share/${encodeURIComponent(link.owner)}/${encodeURIComponent(link.repo)}${query}`;
}

export const postLoginWorkspaceCookie = "gitvn_post_login_workspace";

export function safeWorkspaceDestination(value: string | null | undefined) {
  if (!value?.startsWith("/dashboard?") || value.length > 1500) return null;
  const params = new URLSearchParams(value.slice("/dashboard?".length));
  if (!/^[a-z\d-]{1,39}\/[a-z\d_.-]{1,100}$/i.test(params.get("repo") ?? "")) {
    return null;
  }
  return `/dashboard?${params}`;
}
