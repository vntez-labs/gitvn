import type { Metadata } from "next";
import Link from "next/link";
import { cache, Suspense } from "react";
import { siteUrl } from "@/lib/site-url";
import { dashboardPath, publicSharePath } from "@/lib/workspace-links";

type PageProps = {
  params: Promise<{ owner: string; repo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function githubPublicJson(path: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${path}`, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

const getShareDetails = cache(
  async (owner: string, repo: string, pr?: number) => {
    if (
      !/^[a-z\d-]{1,39}$/i.test(owner) ||
      !/^[a-z\d_.-]{1,100}$/i.test(repo) ||
      repo === "." ||
      repo === ".."
    ) {
      return null;
    }

    const path = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const repository = await githubPublicJson(path);
    if (!repository || repository.private !== false) return null;

    const fullName = `${owner}/${repo}`;
    if (pr) {
      const pull = await githubPublicJson(`${path}/pulls/${pr}`);
      if (typeof pull?.title !== "string") return null;
      return {
        title: `${pull.title} #${pr}`,
        description: `Pull request #${pr} trong ${fullName} trên GitVN.`,
        githubUrl: `https://github.com/${path}/pull/${pr}`,
      };
    }

    return {
      title: fullName,
      description:
        repository.description || `Xem repository ${fullName} trên GitVN.`,
      githubUrl: `https://github.com/${path}`,
    };
  },
);

async function getLink({ params, searchParams }: PageProps) {
  const [{ owner, repo }, query] = await Promise.all([params, searchParams]);
  const pr =
    typeof query.pr === "string" && /^\d+$/.test(query.pr)
      ? Number(query.pr)
      : 0;
  return {
    owner,
    repo,
    pr: Number.isSafeInteger(pr) && pr > 0 ? pr : undefined,
    branch: typeof query.branch === "string" ? query.branch : undefined,
    file: typeof query.file === "string" ? query.file : undefined,
  };
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const link = await getLink(props);
  const { owner, repo, pr } = link;
  const details = await getShareDetails(owner, repo, pr);
  const title = details?.title ?? "Link chia sẻ GitVN";
  const description =
    details?.description ?? "Mở liên kết trong GitVN Workspace.";
  const url = new URL(publicSharePath(link), siteUrl);

  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      siteName: "GitVN Workspace",
      title: `${title} | GitVN`,
      description,
      url,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "GitVN Workspace",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/og-image.png", alt: "GitVN Workspace" }],
    },
  };
}

async function SharePreview(props: PageProps) {
  const link = await getLink(props);
  const details = await getShareDetails(link.owner, link.repo, link.pr);

  return (
    <section className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 sm:p-9">
      <Link href="/" className="text-sm font-bold text-red-700">
        GitVN
      </Link>
      <h1 className="mt-5 break-words text-2xl font-bold">
        {details?.title ?? "Link chia sẻ GitVN"}
      </h1>
      <p className="mt-3 leading-relaxed text-zinc-600">
        {details?.description ??
          "Mở liên kết trong GitVN. Bạn có thể cần đăng nhập hoặc xin quyền truy cập."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={`/api/integrations/github?workspace=${encodeURIComponent(dashboardPath(link))}`}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Mở GitVN
        </a>
        {details && (
          <a
            href={details.githubUrl}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold"
          >
            Xem trên GitHub
          </a>
        )}
      </div>
    </section>
  );
}

export default function SharePage(props: PageProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-50 px-4 py-8">
      <Suspense fallback={<output>Đang tải liên kết…</output>}>
        <SharePreview {...props} />
      </Suspense>
    </main>
  );
}
