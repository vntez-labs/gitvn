import { cookies } from 'next/headers';
import { GitHubUser } from '@/interfaces/github';

export async function getGitHubUser(): Promise<GitHubUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('github_access_token')?.value;
  if (!token) return null;

  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 }, // Cache 1 tiếng
  });

  if (!res.ok) return null;
  return res.json();
}
