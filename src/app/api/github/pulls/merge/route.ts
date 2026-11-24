import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";
import { mergeMethods, pullRepositoryUrl } from "@/lib/pull-request";

export async function PUT(request: Request) {
  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const input = await request.json().catch(() => null);
  const { owner, repo, pullNumber, mergeMethod, sha } = input ?? {};
  const repository = pullRepositoryUrl(owner, repo);
  if (
    !repository ||
    !Number.isSafeInteger(pullNumber) ||
    pullNumber < 1 ||
    typeof mergeMethod !== "string" ||
    !Object.hasOwn(mergeMethods, mergeMethod) ||
    typeof sha !== "string" ||
    !/^[a-f0-9]{40}$/i.test(sha)
  ) {
    return NextResponse.json(
      { error: "Thông tin merge không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${repository}/pulls/${pullNumber}/merge`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ merge_method: mergeMethod, sha }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || data?.merged !== true) {
      return NextResponse.json(
        { error: data?.message || "GitHub chưa xác nhận merge thành công." },
        { status: res.ok ? 409 : res.status },
      );
    }

    return NextResponse.json({ sha: data.sha });
  } catch {
    return NextResponse.json(
      { error: "Không thể kết nối GitHub để merge." },
      { status: 502 },
    );
  }
}
