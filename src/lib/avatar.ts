/**
 * Trả về URL avatar GitHub chuẩn xác.
 * Nếu đối tượng đã có avatar_url thì ưu tiên dùng.
 * Nếu chưa có (hoặc chỉ có login / name), tự động fallback sang https://github.com/{username}.png
 */
export function getGitHubAvatarUrl(
  user?:
    | {
        avatar_url?: string | null;
        login?: string | null;
        name?: string | null;
        username?: string | null;
      }
    | string
    | null,
  size?: number,
): string {
  if (!user) return "";
  if (typeof user === "string") {
    const clean = user.replace(/^@/, "").trim();
    if (!clean) return "";
    return size
      ? `https://github.com/${clean}.png?size=${size}`
      : `https://github.com/${clean}.png`;
  }
  if (
    user.avatar_url &&
    typeof user.avatar_url === "string" &&
    user.avatar_url.trim()
  ) {
    return size && !user.avatar_url.includes("?")
      ? `${user.avatar_url}?s=${size}`
      : user.avatar_url;
  }
  const username = user.login || user.name || user.username;
  if (username && typeof username === "string" && username.trim()) {
    const cleanUser = username.replace(/^@/, "").trim();
    return size
      ? `https://github.com/${cleanUser}.png?size=${size}`
      : `https://github.com/${cleanUser}.png`;
  }
  return "";
}
