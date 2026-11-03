// app/api/github/invitations/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET() {
  const token = await getValidAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      "https://api.github.com/user/repository_invitations?per_page=100",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitVN-App",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Lỗi lấy danh sách lời mời:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  const token = await getValidAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const invitationId = body?.invitationId;

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 },
      );
    }

    const res = await fetch(
      `https://api.github.com/user/repository_invitations/${invitationId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "GitVN-App",
        },
      },
    );

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ success: true });
    }

    const errorData = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.message || "Không thể chấp nhận lời mời" },
      { status: res.status },
    );
  } catch (err: any) {
    console.error("Lỗi chấp nhận lời mời:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
