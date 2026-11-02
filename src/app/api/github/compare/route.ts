import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const base = searchParams.get('base') || 'main';
  const head = searchParams.get('head');

  if (!owner || !repo || !head) {
    return NextResponse.json({ error: 'Thiếu owner, repo hoặc head branch' }, { status: 400 });
  }

  // Nếu base và head giống nhau thì không cần gọi GitHub
  if (base === head) {
    return NextResponse.json({
      status: 'identical',
      ahead_by: 0,
      behind_by: 0,
      total_commits: 0,
      base,
      head,
      compare_url: `https://github.com/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?expand=1`,
    });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('github_access_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
        },
        cache: 'no-store',
      }
    );

    if (res.status === 404) {
      return NextResponse.json({
        status: 'not_found',
        ahead_by: 0,
        behind_by: 0,
        total_commits: 0,
        base,
        head,
        compare_url: `https://github.com/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?expand=1`,
      });
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.message || 'Lỗi compare branches' }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json({
      status: data.status,
      ahead_by: data.ahead_by || 0,
      behind_by: data.behind_by || 0,
      total_commits: data.total_commits || 0,
      base,
      head,
      compare_url:
        data.html_url ||
        `https://github.com/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}?expand=1`,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
