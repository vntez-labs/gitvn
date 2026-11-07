import { NextResponse } from "next/server";
import { getValidAuthToken } from "@/lib/auth-token";

function parseProfileBadges(html: string) {
  const achievements: { name: string; iconUrl: string; tier?: string }[] = [];
  const regex =
    /<img[^>]*src="([^"]+)"[^>]*alt="Achievement:\s*([^"]+)"[^>]*>/gi;
  let match: RegExpExecArray | null = null;

  while (true) {
    match = regex.exec(html);
    if (!match) break;
    const iconUrl = match[1];
    const rawName = match[2].trim();
    const tierMatch = rawName.match(
      /(.*?)(?:,\s*(x\d+|Bronze|Silver|Gold))?$/i,
    );
    const name = tierMatch ? tierMatch[1].trim() : rawName;
    const tier = tierMatch && tierMatch[2] ? tierMatch[2].trim() : undefined;

    if (!achievements.some((a) => a.name === name)) {
      achievements.push({ name, iconUrl, tier });
    }
  }

  const isPro =
    /aria-label="Highlight:\s*Pro"|title="Label:\s*Pro"|class="Label[^"]*"[^>]*>\s*PRO\s*</i.test(
      html,
    );
  return { achievements, isPro };
}

interface UserProfileCacheEntry {
  data: any;
  timestamp: number;
}
const userProfileCache = new Map<string, UserProfileCacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 phút cache

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const rawParams = await params;
  const username = rawParams.username?.trim().replace(/^@/, "");
  if (!username) {
    return NextResponse.json({ error: "Thiếu username" }, { status: 400 });
  }

  const cacheKey = username.toLowerCase();
  const requestTime = Date.now();
  const cached = userProfileCache.get(cacheKey);
  if (cached && requestTime - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  }

  const token = await getValidAuthToken();

  if (!token) {
    return NextResponse.json(
      { error: "Cần đăng nhập GitHub" },
      { status: 401 },
    );
  }

  try {
    const graphqlQuery = {
      query: `
        query($login: String!) {
          user(login: $login) {
            name
            login
            avatarUrl
            bio
            company
            location
            email
            websiteUrl
            createdAt
            followers { totalCount }
            following { totalCount }
            pullRequests { totalCount }
            mergedPullRequests: pullRequests(states: MERGED) { totalCount }
            issues { totalCount }
            repositoriesContributedTo(contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
              totalCount
            }
            contributionsCollection {
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalPullRequestReviewContributions
              totalRepositoriesWithContributedCommits
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    contributionLevel
                    weekday
                  }
                }
              }
            }
            repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: STARGAZERS, direction: DESC}) {
              totalCount
              nodes {
                name
                description
                url
                stargazerCount
                forkCount
                licenseInfo { spdxId }
                releases { totalCount }
                primaryLanguage { name color }
                languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                  edges {
                    size
                    node { name color }
                  }
                }
              }
            }
            organizations(first: 10) {
              nodes { login avatarUrl url }
            }
          }
        }
      `,
      variables: { login: username },
    };

    const [gqlRes, readmeRes, profileHtmlRes] = await Promise.all([
      fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify(graphqlQuery),
        cache: "no-store",
      }),
      fetch(`https://api.github.com/repos/${username}/${username}/readme`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
        cache: "no-store",
      }),
      fetch(`https://github.com/${username}?tab=achievements`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        cache: "no-store",
        signal: AbortSignal.timeout(3000), // Timeout 3s để không bao giờ block trang
      }).catch(() => null),
    ]);

    const gqlData = await gqlRes.json();
    if (!gqlData.data?.user) {
      const errMsg =
        gqlData.errors?.[0]?.message ||
        `Không tìm thấy người dùng @${username} trên GitHub`;
      return NextResponse.json({ error: errMsg }, { status: 404 });
    }

    const userData = gqlData.data.user;
    const repos = userData.repositories?.nodes || [];

    // README & Achievements
    let readmeContent = "";
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json().catch(() => null);
      if (readmeData?.content) {
        readmeContent = Buffer.from(readmeData.content, "base64").toString(
          "utf-8",
        );
      }
    }
    const profileHtml =
      profileHtmlRes && profileHtmlRes.ok
        ? await profileHtmlRes.text().catch(() => "")
        : "";
    const { achievements, isPro } = parseProfileBadges(profileHtml);

    // 1. Phân bổ ngôn ngữ lập trình theo byte thật
    const langMap: Record<
      string,
      { name: string; color: string; size: number }
    > = {};
    let totalBytes = 0;
    let reposWithLicense = 0;
    let totalReleases = 0;

    repos.forEach((repo: any) => {
      if (repo.licenseInfo?.spdxId) reposWithLicense += 1;
      totalReleases += repo.releases?.totalCount || 0;

      repo.languages?.edges?.forEach((edge: any) => {
        const name = edge.node.name;
        const color = edge.node.color || "#8b949e";
        const size = edge.size || 0;

        if (!langMap[name]) langMap[name] = { name, color, size: 0 };
        langMap[name].size += size;
        totalBytes += size;
      });
    });

    const languages = Object.values(langMap)
      .map((item) => ({
        ...item,
        percent:
          totalBytes > 0
            ? Number(((item.size / totalBytes) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.size - a.size);

    // 2. Tính thâm niên chi tiết
    const createdDate = new Date(userData.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365.25);
    const months = Math.floor((totalDays % 365.25) / 30.43);

    // 3. Tính streak đóng góp từ Calendar
    const calendar = userData.contributionsCollection?.contributionCalendar;
    const allDays: any[] = [];
    calendar?.weeks?.forEach((w: any) => {
      w.contributionDays?.forEach((d: any) => {
        allDays.push(d);
      });
    });

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < allDays.length; i++) {
      if (allDays[i].contributionCount > 0) {
        tempStreak += 1;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }
    // Tính current streak từ ngày gần nhất quay ngược lại
    for (let i = allDays.length - 1; i >= 0; i--) {
      if (allDays[i].contributionCount > 0) {
        currentStreak += 1;
      } else if (i === allDays.length - 1) {
      } else {
        break;
      }
    }

    const totalStars = repos.reduce(
      (sum: number, r: any) => sum + (r.stargazerCount || 0),
      0,
    );
    const totalForks = repos.reduce(
      (sum: number, r: any) => sum + (r.forkCount || 0),
      0,
    );

    const payload = {
      user: {
        name: userData.name,
        login: userData.login,
        avatar_url: userData.avatarUrl,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        email: userData.email,
        blog: userData.websiteUrl,
        created_at: userData.createdAt,
        followers: userData.followers?.totalCount ?? 0,
        following: userData.following?.totalCount ?? 0,
        html_url: `https://github.com/${userData.login}`,
      },
      seniority: {
        totalDays,
        years,
        months,
        formattedJoined: createdDate.toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
      streak: {
        currentStreak,
        maxStreak,
      },
      shipReadiness: {
        totalReleases,
        reposWithLicense,
        licenseRate:
          repos.length > 0
            ? Math.round((reposWithLicense / repos.length) * 100)
            : 0,
      },
      isPro,
      achievements,
      orgs: userData.organizations?.nodes || [],
      readme: readmeContent,
      pinnedRepos: repos.slice(0, 6),
      languages,
      totalCodeBytes: totalBytes,
      stats: {
        totalContributions: calendar?.totalContributions ?? 0,
        totalCommits:
          userData.contributionsCollection?.totalCommitContributions ?? 0,
        totalPRs:
          userData.pullRequests?.totalCount ??
          userData.contributionsCollection?.totalPullRequestContributions ??
          0,
        mergedPRs: userData.mergedPullRequests?.totalCount ?? 0,
        recentPRs:
          userData.contributionsCollection?.totalPullRequestContributions ?? 0,
        totalIssues:
          userData.issues?.totalCount ??
          userData.contributionsCollection?.totalIssueContributions ??
          0,
        recentIssues:
          userData.contributionsCollection?.totalIssueContributions ?? 0,
        totalReviews:
          userData.contributionsCollection
            ?.totalPullRequestReviewContributions ?? 0,
        contributedRepoCount:
          userData.repositoriesContributedTo?.totalCount ??
          userData.contributionsCollection
            ?.totalRepositoriesWithContributedCommits ??
          0,
        totalStars,
        starsReceived: totalStars,
        totalForks,
        totalRepos: userData.repositories?.totalCount ?? 0,
      },
      calendarWeeks: calendar?.weeks || [],
    };

    userProfileCache.set(cacheKey, {
      data: payload,
      timestamp: Date.now(),
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[API /api/github/user] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
