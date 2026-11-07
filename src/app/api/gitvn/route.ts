import fs from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import type { GitvnDocItem, GitvnRepoStatus } from "@/interfaces/gitvn";
import {
  commitFileToGitHub,
  getAuthToken,
  getAuthUser,
} from "@/lib/github-api";
import {
  configToYaml,
  detectOutdated,
  LATEST_GITVN_VERSION,
  parseGitvnConfig,
} from "@/lib/gitvn-config";
import { initializeGitvnRepo } from "@/lib/gitvn-init";
import {
  inspectGitHubGitvn,
  LOCAL_GITVN_DIR,
  upgradeGitvnRepo,
} from "@/lib/gitvn-service";
import { createDefaultConfig } from "@/lib/gitvn-templates";

interface GitvnCacheEntry {
  data: GitvnRepoStatus;
  timestamp: number;
}

const gitvnStatusCache = new Map<string, GitvnCacheEntry>();
const inFlightRequests = new Map<string, Promise<GitvnRepoStatus | null>>();
const CACHE_TTL_MS = 60 * 1000; // 60s cache

function invalidateGitvnCache(owner: string, repo: string) {
  const prefix = `${owner}/${repo}`.toLowerCase();
  for (const key of gitvnStatusCache.keys()) {
    if (key.startsWith(prefix)) {
      gitvnStatusCache.delete(key);
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const branch = searchParams.get("branch") || undefined;

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "Thiếu owner hoặc repo" },
      { status: 400 },
    );
  }

  const cacheKey = `${owner}/${repo}@${branch || "default"}`.toLowerCase();
  const now = Date.now();
  const cached = gitvnStatusCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    });
  }

  const token = await getAuthToken();

  // 1. Kiểm tra trên GitHub nếu có token
  if (token) {
    let pending = inFlightRequests.get(cacheKey);
    if (!pending) {
      pending = inspectGitHubGitvn(owner, repo, token, branch);
      inFlightRequests.set(cacheKey, pending);
    }

    try {
      const ghStatus = await pending;
      if (ghStatus) {
        gitvnStatusCache.set(cacheKey, { data: ghStatus, timestamp: now });
        return NextResponse.json(ghStatus, {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
          },
        });
      }

      // ghStatus === null: Repo trên GitHub KHÔNG có thư mục .gitvn
      // Trả về hasGitvn: false rõ ràng, TUYỆT ĐỐI không fallback sang thư mục máy chủ cục bộ
      const notFoundStatus: GitvnRepoStatus = {
        hasGitvn: false,
        hasConfig: false,
        hasTasks: false,
        hasDocs: false,
        source: "github",
        isOutdated: false,
      };
      gitvnStatusCache.set(cacheKey, { data: notFoundStatus, timestamp: now });
      return NextResponse.json(notFoundStatus);
    } catch (err) {
      console.warn("[inspectGitHubGitvn error]:", err);
      const errorStatus: GitvnRepoStatus = {
        hasGitvn: false,
        hasConfig: false,
        hasTasks: false,
        hasDocs: false,
        source: "none",
        isOutdated: false,
      };
      return NextResponse.json(errorStatus);
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  }

  // 2. Fallback: CHỈ kiểm tra trên local filesystem khi không có token (chạy offline / dev mode)
  try {
    const yamlPath = path.join(LOCAL_GITVN_DIR, "config.yml");
    const jsonPath = path.join(LOCAL_GITVN_DIR, "config.json");
    const tasksPath = path.join(LOCAL_GITVN_DIR, "tasks.json");
    const tasksDir = path.join(LOCAL_GITVN_DIR, "tasks");
    const docsDir = path.join(LOCAL_GITVN_DIR, "docs");

    let localConfig = null;
    let configFormat: "yaml" | "json" = "yaml";
    try {
      const yamlRaw = await fs.readFile(yamlPath, "utf-8");
      localConfig = parseGitvnConfig(yamlRaw, true);
    } catch {
      try {
        const jsonRaw = await fs.readFile(jsonPath, "utf-8");
        localConfig = parseGitvnConfig(jsonRaw, false);
        configFormat = "json";
      } catch {}
    }

    let hasLocalTasksJson = false;
    try {
      await fs.access(tasksPath);
      hasLocalTasksJson = true;
    } catch {}

    let hasDecoupledTasks = false;
    try {
      const taskFiles = await fs.readdir(tasksDir);
      hasDecoupledTasks = taskFiles.length > 0;
    } catch {}

    const docsList: GitvnDocItem[] = [];
    try {
      const files = await fs.readdir(docsDir);
      for (const fileName of files) {
        if (fileName.endsWith(".md") || fileName.endsWith(".mdx")) {
          const content = await fs.readFile(
            path.join(docsDir, fileName),
            "utf-8",
          );
          const heading = content.match(/^#\s+(.+)$/m);
          docsList.push({
            id: fileName.replace(/\.[^/.]+$/, ""),
            name: fileName,
            path: `.gitvn/docs/${fileName}`,
            title: heading ? heading[1].trim() : fileName,
            content,
          });
        }
      }
    } catch {}

    const hasGitvn = Boolean(
      localConfig || hasLocalTasksJson || hasDecoupledTasks || docsList.length,
    );
    if (hasGitvn) {
      const { isOutdated, reason } = detectOutdated(
        localConfig,
        hasDecoupledTasks,
        hasLocalTasksJson,
      );
      return NextResponse.json<GitvnRepoStatus>({
        hasGitvn: true,
        hasConfig: Boolean(localConfig),
        hasTasks: hasLocalTasksJson || hasDecoupledTasks,
        hasDocs: docsList.length > 0,
        config: localConfig || createDefaultConfig(repo),
        docs: docsList,
        source: "local",
        isOutdated,
        currentVersion:
          localConfig?.version || (hasLocalTasksJson ? "1.0.0" : undefined),
        latestVersion: LATEST_GITVN_VERSION,
        hasDecoupledTasks,
        configFormat,
        reason,
      });
    }
  } catch {}

  return NextResponse.json<GitvnRepoStatus>({
    hasGitvn: false,
    hasConfig: false,
    hasTasks: false,
    hasDocs: false,
    source: "none",
    isOutdated: false,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, owner, repo, branch, docName, docContent, config } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Thiếu owner hoặc repo" },
        { status: 400 },
      );
    }

    // Xóa cache để các request GET sau đó nhận trạng thái mới nhất
    invalidateGitvnCache(owner, repo);

    const token = await getAuthToken();
    const user = await getAuthUser();
    const currentUserLogin = user?.login || "admin";

    // ACTION 1: NÂNG CẤP LÊN V2 DECOUPLED SCHEMA
    if (action === "upgrade") {
      const upgradeRes = await upgradeGitvnRepo(owner, repo, token, branch);
      return NextResponse.json({
        success: upgradeRes.success,
        migratedTasksCount: upgradeRes.migratedTasksCount,
        message: `Đã nâng cấp dự án sang quy chuẩn .gitvn v${LATEST_GITVN_VERSION} thành công!`,
      });
    }

    // ACTION 2: KHỞI TẠO .gitvn CHUẨN V2
    if (action === "init") {
      const initRes = await initializeGitvnRepo(
        owner,
        repo,
        currentUserLogin,
        token,
        branch,
      );
      return NextResponse.json({
        success: initRes.success,
        message: "Khởi tạo cấu trúc .gitvn v2 thành công!",
        syncedToGitHub: initRes.syncedToGitHub,
        config: initRes.config,
      });
    }

    // ACTION 3: LƯU TÀI LIỆU MDX
    if (action === "save-doc" || action === "saveDoc") {
      const targetDocName = docName || body.filename;
      const targetDocContent =
        docContent !== undefined ? docContent : body.content;
      if (!targetDocName || typeof targetDocContent !== "string") {
        return NextResponse.json(
          { error: "Thiếu tên hoặc nội dung tài liệu" },
          { status: 400 },
        );
      }
      const safeDocName =
        targetDocName.endsWith(".mdx") || targetDocName.endsWith(".md")
          ? targetDocName
          : `${targetDocName}.mdx`;
      try {
        const docsDir = path.join(LOCAL_GITVN_DIR, "docs");
        await fs.mkdir(docsDir, { recursive: true });
        await fs.writeFile(
          path.join(docsDir, safeDocName),
          targetDocContent,
          "utf-8",
        );
      } catch {}

      let syncedToGitHub = false;
      if (token) {
        const res = await commitFileToGitHub(
          owner,
          repo,
          `.gitvn/docs/${safeDocName}`,
          targetDocContent,
          token,
          `docs(gitvn): update .gitvn/docs/${safeDocName}`,
          branch,
        );
        syncedToGitHub = res.ok;
      }
      return NextResponse.json({
        success: true,
        file: `.gitvn/docs/${safeDocName}`,
        syncedToGitHub,
      });
    }

    // ACTION 4: LƯU CẤU HÌNH CONFIG.YML
    if (action === "save-config") {
      if (!config) {
        return NextResponse.json(
          { error: "Thiếu dữ liệu config" },
          { status: 400 },
        );
      }
      const configYaml = configToYaml(config);
      try {
        await fs.mkdir(LOCAL_GITVN_DIR, { recursive: true });
        await fs.writeFile(
          path.join(LOCAL_GITVN_DIR, "config.yml"),
          configYaml,
          "utf-8",
        );
      } catch {}

      let syncedToGitHub = false;
      if (token) {
        const res = await commitFileToGitHub(
          owner,
          repo,
          ".gitvn/config.yml",
          configYaml,
          token,
          `chore(gitvn): update config.yml`,
          branch,
        );
        syncedToGitHub = res.ok;
      }
      return NextResponse.json({ success: true, syncedToGitHub });
    }

    return NextResponse.json(
      { error: "Hành động không hợp lệ" },
      { status: 400 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
