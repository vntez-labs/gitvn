import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, username, permission } = body;

    if (!owner || !repo || !username) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (owner, repo, username)" },
        { status: 400 },
      );
    }

    const cleanUsername = username.replace(/^@/, "").trim();

    // Gọi GitHub API mời collaborator
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/collaborators/${cleanUsername}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "GitVN-App",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          permission: permission || "push",
        }),
      },
    );

    // 201: Đã tạo lời mời thành công
    // 204: Người dùng đã là collaborator sẵn rồi
    if (res.status === 204) {
      return NextResponse.json({
        success: true,
        alreadyCollaborator: true,
        message: `@${cleanUsername} đã là thành viên của repository này!`,
      });
    }

    if (res.status === 201) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        alreadyCollaborator: false,
        message: `Đã gửi lời mời tham gia dự án đến @${cleanUsername}!`,
        invitation: data,
      });
    }

    const errData = await res.json().catch(() => ({}));
    console.error("[GitHub Invite Error]", {
      owner,
      repo,
      username: cleanUsername,
      status: res.status,
      errData,
    });

    let errorMessage =
      errData.message ||
      "Không thể gửi lời mời. Hãy kiểm tra bạn có quyền Admin trên repository này.";
    if (errData.message === "Resource not accessible by integration") {
      errorMessage = `GitHub App chưa được cài đặt (Install) trên tài khoản '${owner}'. Hãy vào GitHub App Settings -> Install App -> bấm Install vào '${owner}'. (Hoặc dùng OAuth App để tự động hỗ trợ mọi repo).`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: res.status },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
