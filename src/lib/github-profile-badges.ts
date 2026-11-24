export function parseProfileBadges(html: string) {
  const achievements: { name: string; iconUrl: string; tier?: string }[] = [];

  const linkRegex =
    /<a[^>]*href="\/[^"]*\?achievement=([^&"]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null = null;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const inner = linkMatch[2];
    const imgMatch = inner.match(
      /<img[^>]*src="([^"]+)"[^>]*alt="Achievement:\s*([^"]+)"/i,
    );
    if (imgMatch) {
      const iconUrl = imgMatch[1];
      const name = imgMatch[2].trim();
      const tierMatch = inner.match(
        /class="[^"]*achievement-tier-label[^"]*"[^>]*>([^<]+)<\/span>/i,
      );
      const tier = tierMatch ? tierMatch[1].trim() : undefined;
      if (!achievements.some((a) => a.name === name)) {
        achievements.push({ name, iconUrl, tier });
      }
    }
  }

  if (achievements.length === 0) {
    const imgRegex =
      /<img[^>]*src="([^"]+)"[^>]*alt="Achievement:\s*([^"]+)"[^>]*>/gi;
    let imgMatch: RegExpExecArray | null = null;
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const iconUrl = imgMatch[1];
      const rawName = imgMatch[2].trim();
      const tierMatch = rawName.match(
        /(.*?)(?:,\s*(x\d+|Bronze|Silver|Gold))?$/i,
      );
      const name = tierMatch ? tierMatch[1].trim() : rawName;
      const tier = tierMatch && tierMatch[2] ? tierMatch[2].trim() : undefined;
      if (!achievements.some((a) => a.name === name)) {
        achievements.push({ name, iconUrl, tier });
      }
    }
  }

  const isPro =
    /title="Label:\s*Pro"|aria-label="Highlight:\s*Pro"|class="Label[^"]*"[^>]*>\s*PRO\s*</i.test(
      html,
    );
  return { achievements, isPro };
}
