import type { GitHubUser } from "@/interfaces/github";
import { fetchGitHubWithAuth, getValidAuthToken } from "@/lib/auth-token";

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const token = await getValidAuthToken();
  if (!token) return null;

  try {
    const res = await fetchGitHubWithAuth("https://api.github.com/user");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
