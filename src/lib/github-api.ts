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

export interface GitFileChange {
  path: string;
  content: string;
}

/**
 * Commit nhiều file cùng lúc trong 1 commit duy nhất (Git Data API: Trees & Commits)
 */
export async function commitMultipleFilesToGitHub(
  owner: string,
  repo: string,
  files: GitFileChange[],
  token: string,
  message: string,
  branch = "main",
): Promise<{ ok: boolean; commitSha?: string; error?: string }> {
  if (!files || files.length === 0) {
    return { ok: true };
  }

  // Nếu chỉ có 1 file, dùng commitFileToGitHub cho nhanh và nhẹ
  if (files.length === 1) {
    const single = files[0];
    const res = await commitFileToGitHub(
      owner,
      repo,
      single.path,
      single.content,
      token,
      message,
      branch,
    );
    return { ok: res.ok, commitSha: res.sha, error: res.error };
  }

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "GitVN-App",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    };

    // 1. Lấy latest commit SHA của nhánh
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { headers, cache: "no-store" },
    );

    if (!refRes.ok) {
      // Fallback nếu không đọc được Git Ref: commit từng file
      for (const f of files) {
        await commitFileToGitHub(
          owner,
          repo,
          f.path,
          f.content,
          token,
          message,
          branch,
        );
      }
      return { ok: true };
    }

    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. Lấy base tree SHA từ latest commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      { headers, cache: "no-store" },
    );
    if (!commitRes.ok) {
      return { ok: false, error: "Không thể lấy thông tin commit gốc" };
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Tạo Git Tree mới chứa toàn bộ files
    const treeItems = files.map((f) => ({
      path: f.path,
      mode: "100644" as const,
      type: "blob" as const,
      content: f.content,
    }));

    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      },
    );

    if (!treeRes.ok) {
      // Fallback nếu Git Tree API lỗi
      for (const f of files) {
        await commitFileToGitHub(
          owner,
          repo,
          f.path,
          f.content,
          token,
          message,
          branch,
        );
      }
      return { ok: true };
    }

    const treeData = await treeRes.json();
    const newTreeSha = treeData.sha;

    // 4. Tạo Commit mới duy nhất
    const newCommitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          tree: newTreeSha,
          parents: [latestCommitSha],
        }),
      },
    );

    if (!newCommitRes.ok) {
      const err = await newCommitRes.json().catch(() => ({}));
      return { ok: false, error: err.message || "Lỗi tạo Git Commit" };
    }

    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // 5. Cập nhật nhánh Git trỏ tới commit mới
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          sha: newCommitSha,
          force: false,
        }),
      },
    );

    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      return { ok: false, error: err.message || "Lỗi cập nhật nhánh Git" };
    }

    return { ok: true, commitSha: newCommitSha };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
