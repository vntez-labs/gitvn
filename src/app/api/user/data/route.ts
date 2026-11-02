// app/api/user/data/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('github_access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Chỉ cần gọi API lấy repos
    const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const repos = reposRes.ok ? await reposRes.json() : [];

    // Trích xuất các Organization từ owner của repo
    const orgsMap = new Map();
    repos.forEach((repo: any) => {
      // Loại trừ repo cá nhân (owner type là 'User')
      if (repo.owner && repo.owner.type === 'Organization') {
        orgsMap.set(repo.owner.login, {
          login: repo.owner.login,
          id: repo.owner.id,
          avatar_url: repo.owner.avatar_url,
          description: null, // API repo không trả về description của org
        });
      }
    });

    const orgs = Array.from(orgsMap.values());

    return NextResponse.json({ repos, orgs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
