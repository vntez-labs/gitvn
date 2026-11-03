import { NextResponse } from "next/server";
import { fetchGitHubWithAuth, getValidAuthToken } from "@/lib/auth-token";

export async function GET() {
  const token = await getValidAuthToken();

  if (!token) {
    // Không đăng nhập hoặc token đã hết hạn không thể refresh -> Trả về user: null với 200 OK
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const res = await fetchGitHubWithAuth("https://api.github.com/user");

    if (!res.ok) {
      console.warn(`[api/user] GitHub /user returned ${res.status}`);
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await res.json();
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("[api/user exception]:", err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
