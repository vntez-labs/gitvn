import { getValidAuthToken } from "./auth-token";

export async function getAuthToken(): Promise<string | undefined> {
  const token = await getValidAuthToken();
  return token || undefined;
}

export async function getAuthUser(): Promise<{
  login: string;
  name?: string;
  avatar_url?: string;
} | null> {
  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "GitVN-App",
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Đọc nội dung file text raw từ GitHub repo
 */
export async function fetchFileFromGitHub(
  owner: string,
  repo: string,
  filePath: string,
  token?: string,
  branch?: string,
): Promise<{ ok: boolean; content?: string; sha?: string; status?: number }> {
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${refQuery}`;

  const headers: Record<string, string> = {
    "User-Agent": "GitVN-App",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers: { ...headers, Accept: "application/vnd.github.raw" },
      cache: "no-store",
    });

    if (res.ok) {
      const content = await res.text();
      return { ok: true, content, status: res.status };
    }

    return { ok: false, status: res.status };
  } catch {
    return { ok: false, status: 500 };
  }
}

/**
 * Đọc danh sách file trong 1 folder từ GitHub repo
 */
export async function fetchFolderContents(
  owner: string,
  repo: string,
  dirPath: string,
  token?: string,
  branch?: string,
): Promise<{ ok: boolean; items: any[] }> {
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${dirPath}${refQuery}`;

  const headers: Record<string, string> = {
    "User-Agent": "GitVN-App",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      headers: { ...headers, Accept: "application/vnd.github+json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, items: Array.isArray(data) ? data : [data] };
    }
    return { ok: false, items: [] };
  } catch {
    return { ok: false, items: [] };
  }
}

/**
 * Commit một file lên GitHub repo
 */
export async function commitFileToGitHub(
  owner: string,
  repo: string,
  filePath: string,
  content: string,
  token: string,
  message: string,
  branch?: string,
): Promise<{ ok: boolean; sha?: string; error?: string }> {
  try {
    let sha: string | undefined;
    const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : "";
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}${refQuery}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "GitVN-App",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const getRes = await fetch(getUrl, { headers, cache: "no-store" });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
          branch: branch || undefined,
        }),
      },
    );

    if (!putRes.ok) {
      const errData = await putRes.json().catch(() => ({}));
      return {
        ok: false,
        error: errData.message || `GitHub status ${putRes.status}`,
      };
    }

    const putData = await putRes.json();
    return { ok: true, sha: putData.content?.sha };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
