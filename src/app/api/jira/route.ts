import { NextResponse } from "next/server";
import type { JiraBoardData } from "@/interfaces/jira";
import { getAuthToken, getAuthUser } from "@/lib/github-api";
import {
  createCleanDefaultBoard,
  fetchBoardFromGitHub,
  getLegacyRepoFilePath,
  getPrimaryTasksFilePath,
  getRepoTasksFilePath,
  safeReadFile,
  safeWriteFile,
  syncBoardToGitHub,
} from "@/lib/jira-storage";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch");

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Thiếu owner hoặc repo" },
        { status: 400 },
      );
    }

    const token = await getAuthToken();
    const user = await getAuthUser();
    const currentUserLogin = user?.login || "anonymous";

    const primaryTasksPath = getPrimaryTasksFilePath();
    const repoTasksPath = getRepoTasksFilePath(owner, repo);
    const legacyRepoPath = getLegacyRepoFilePath(owner, repo);

    // 1. Thử đọc từ GitHub
    const remoteData = await fetchBoardFromGitHub(owner, repo, token, branch);
    if (remoteData) {
      remoteData.owner = owner;
      remoteData.repo = repo;

      await safeWriteFile(repoTasksPath, JSON.stringify(remoteData, null, 2));
      if (repo.toLowerCase() === "gitvn") {
        await safeWriteFile(
          primaryTasksPath,
          JSON.stringify(remoteData, null, 2),
        );
      }

      return NextResponse.json({
        data: remoteData,
        source: "github",
        syncedToGitHub: true,
        file: ".gitvn/tasks.json",
      });
    }

    // 2. Thử đọc từ file local cache
    const localCandidates = [repoTasksPath, primaryTasksPath, legacyRepoPath];

    for (const candidatePath of localCandidates) {
      const content = await safeReadFile(candidatePath);
      if (!content) continue;

      try {
        const data: JiraBoardData = JSON.parse(content);
        const matchesRepo =
          (data.owner?.toLowerCase() === owner.toLowerCase() &&
            data.repo?.toLowerCase() === repo.toLowerCase()) ||
          (candidatePath === primaryTasksPath &&
            repo.toLowerCase() === "gitvn");

        if (matchesRepo && data.tasks && data.sprints) {
          data.owner = owner;
          data.repo = repo;

          if (
            user &&
            data.permissions?.userRoles &&
            !data.permissions.userRoles[user.login]
          ) {
            data.permissions.userRoles[user.login] =
              user.login.toLowerCase() === owner.toLowerCase()
                ? "admin"
                : data.permissions.defaultRole || "member";
          }

          await safeWriteFile(repoTasksPath, JSON.stringify(data, null, 2));
          if (repo.toLowerCase() === "gitvn") {
            await safeWriteFile(
              primaryTasksPath,
              JSON.stringify(data, null, 2),
            );
          }

          return NextResponse.json({
            data,
            source: "local",
            file: ".gitvn/tasks.json",
            syncedToGitHub: false,
          });
        }
      } catch {}
    }

    // 3. Nếu chưa có dữ liệu nào -> Tạo bảng mặc định
    const defaultData = createCleanDefaultBoard(owner, repo, currentUserLogin);
    await safeWriteFile(repoTasksPath, JSON.stringify(defaultData, null, 2));
    if (repo.toLowerCase() === "gitvn") {
      await safeWriteFile(
        primaryTasksPath,
        JSON.stringify(defaultData, null, 2),
      );
    }

    let synced = false;
    if (token) {
      const syncRes = await syncBoardToGitHub(
        owner,
        repo,
        defaultData,
        token,
        branch,
      );
      synced = syncRes.ok;
    }

    return NextResponse.json({
      data: defaultData,
      source: "initialized",
      file: ".gitvn/tasks.json",
      syncedToGitHub: synced,
    });
  } catch (err: any) {
    console.error("Error in GET /api/jira:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { owner, repo, branch, data } = body;

    const forceGitHubSync =
      body.forceGitHubSync !== undefined
        ? Boolean(body.forceGitHubSync)
        : body.syncToGitHub !== undefined
          ? Boolean(body.syncToGitHub)
          : true;

    if (!owner || !repo || !data) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu cập nhật" },
        { status: 400 },
      );
    }

    data.owner = owner;
    data.repo = repo;

    const primaryTasksPath = getPrimaryTasksFilePath();
    const repoTasksPath = getRepoTasksFilePath(owner, repo);

    // 1. Lưu local cache
    await safeWriteFile(repoTasksPath, JSON.stringify(data, null, 2));
    if (repo.toLowerCase() === "gitvn" || !process.env.VERCEL) {
      await safeWriteFile(primaryTasksPath, JSON.stringify(data, null, 2));
    }

    // 2. Đồng bộ lên GitHub repo nếu có token
    let syncedToGitHub = false;
    let githubError: string | undefined;

    const token = await getAuthToken();
    if (token && forceGitHubSync) {
      const syncResult = await syncBoardToGitHub(
        owner,
        repo,
        data,
        token,
        branch,
      );
      syncedToGitHub = syncResult.ok;
      githubError = syncResult.error;
    }

    return NextResponse.json({
      success: true,
      data,
      file: ".gitvn/tasks.json",
      syncedToGitHub,
      githubError,
    });
  } catch (err: any) {
    console.error("Error in POST /api/jira:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
