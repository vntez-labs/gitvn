import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    // Không đăng nhập -> Trả về user: null với 200 OK thay vì 401
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await res.json();
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
