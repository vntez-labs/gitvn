import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const path = searchParams.get("path");
  const ref = searchParams.get("ref") || searchParams.get("branch");

  if (!owner || !repo || !path) {
    return NextResponse.json(
      { error: "Thiếu thông tin file" },
      { status: 400 },
    );
  }

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    );
    if (ref) url.searchParams.set("ref", ref);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw", // Trả thẳng text raw, không cần giải mã base64
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Lỗi tải nội dung file" },
        { status: res.status },
      );
    }

    const content = await res.text();
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
