"use client";

import {
  Badge,
  Box,
  Group,
  Image,
  Paper,
  Progress,
  SimpleGrid,
  Text,
  Tooltip,
} from "@mantine/core";
import type { ContributionWeek } from "@/interfaces/profile-insights";
import { activityRanks, getActivityRank } from "@/lib/activity-rank";
import type { ScoreResult } from "@/lib/scoring/models";

const number = new Intl.NumberFormat("vi-VN");
const scoreNumber = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const metricUnits: Record<string, string> = {
  stars: "sao",
  followers: "người theo dõi",
  commits: "commit",
  pulls: "PR",
  activeWeeks: "tuần",
  activeDays: "ngày",
  qualified: "kho đạt ngưỡng",
  sustained: "kho duy trì",
  merged: "PR được hợp nhất",
  reviewed: "PR được review",
};

const roleMetricLabels = {
  reviewPrs: "Số PR đã review",
  reviewAuthors: "Số tác giả PR đã review",
  contributorMerges: "PR được người khác hợp nhất",
  contributorReviews: "PR được người khác review",
  maintainerMerges: "PR của người khác đã hợp nhất",
  maintainerAuthors: "Số tác giả có đóng góp được tích hợp",
  resolvedIssues: "Issue được giải quyết qua PR",
};

export function ActivityRank({
  weeks,
  contributions,
  repositories,
  currentStreak,
  longestStreak = 0,
  pulls = 0,
  reviews = 0,
  issues = 0,
  commits = 0,
  stars = 0,
  releases = 0,
  forks = 0,
  followers = 0,
  scoreV3,
}: {
  weeks: ContributionWeek[];
  contributions: number;
  repositories: number;
  currentStreak: number;
  longestStreak?: number;
  pulls?: number;
  reviews?: number;
  issues?: number;
  commits?: number;
  stars?: number;
  releases?: number;
  forks?: number;
  followers?: number;
  scoreV3?: ScoreResult;
}) {
  const result = scoreV3
    ? null
    : getActivityRank({
        weeks,
        contributions,
        repositories,
        currentStreak,
        longestStreak,
        pulls,
        reviews,
        issues,
        commits,
        stars,
        releases,
        forks,
        followers,
      });

  const ranks = scoreV3
    ? activityRanks.map((tier, index) => ({
        ...tier,
        minScore: scoreV3.rankThresholds[index],
      }))
    : activityRanks;
  const score = scoreV3?.totalScore ?? result?.score ?? 0;
  const rank =
    ranks[
      scoreV3?.rank ?? ranks.findLastIndex((tier) => tier.minScore <= score)
    ];
  const next = scoreV3
    ? scoreV3.nextRank === null
      ? undefined
      : ranks[scoreV3.nextRank]
    : result?.next;
  const activeWeeks = scoreV3
    ? scoreV3.categories
        .find((category) => category.id === "consistency")
        ?.metrics.find((metric) => metric.id === "activeWeeks")?.adjusted
    : result?.activeWeeks;
  const remaining =
    scoreV3?.pointsToNextRank ?? (next ? Math.ceil(next.minScore - score) : 0);
  const totalProgress = score;
  const labels = {
    impact: "Tác động cộng đồng",
    activity: "Hoạt động đóng góp",
    consistency: "Chuyên cần & Kỷ luật",
    coverage: "Độ phủ dự án",
    collaboration: "Cộng tác",
  };
  const role = scoreV3?.collaboration;
  const roleCounts = [
    role?.review.metrics[0].raw == null
      ? null
      : `${number.format(role.review.metrics[0].raw)} PR đã review`,
    role?.maintainer.metrics[0].raw == null
      ? null
      : `${number.format(role.maintainer.metrics[0].raw)} PR đã hợp nhất`,
  ].filter(Boolean);
  const criteria = scoreV3
    ? scoreV3.categories.map((category) => {
        if (category.id === "collaboration" && role)
          return {
            label: labels.collaboration,
            maxPoints: category.maximum,
            points: category.points,
            stat: roleCounts.join(" · ") || "Chưa có bằng chứng cộng tác",
            detail:
              role.minimum === role.maximum
                ? "Đã xác định điểm"
                : "Số liệu quan sát được · 365 ngày UTC",
          };
        const resolved = category.metrics.every(
          (metric) => metric.scoreResolved,
        );
        const complete = category.metrics.every(
          (metric) => metric.availability === "complete",
        );
        const units = category.metrics
          .slice(0, 2)
          .filter((metric) => metric.raw !== null)
          .map(
            (metric) =>
              `${number.format(metric.raw ?? 0)} ${metricUnits[metric.id]}`,
          );
        const status = complete
          ? "Đã thu thập đầy đủ"
          : resolved
            ? "Đã xác định điểm"
            : "Cần bổ sung dữ liệu";
        return {
          label: labels[category.id],
          maxPoints: category.maximum,
          points: category.points,
          stat: units.join(" · ") || status,
          detail: `${status} · ${category.id === "impact" ? "Ảnh chụp tích lũy" : "365 ngày UTC"}`,
        };
      })
    : [
        {
          label: "Tác động xã hội",
          maxPoints: 30,
          points: result?.impactPoints ?? 0,
          stat: `⭐ ${number.format(stars)} · 📦 ${number.format(releases)}`,
          detail: `${number.format(followers)} người theo dõi`,
        },
        {
          label: "Năng suất đóng góp",
          maxPoints: 30,
          points: result?.activityPoints ?? 0,
          stat: `${number.format(contributions)} đóng góp`,
          detail:
            pulls + reviews > 0
              ? `${pulls} PRs · ${reviews} reviews`
              : "Mục tiêu 2.000 đóng góp",
        },
        {
          label: "Chuyên cần & Kỷ luật",
          maxPoints: 25,
          points: result?.consistencyPoints ?? 0,
          stat: `${activeWeeks ?? 0}/52 tuần`,
          detail: `Kỷ lục ${number.format(result?.longestStreak ?? 0)} ngày chuỗi`,
        },
        {
          label: "Độ phủ dự án",
          maxPoints: 15,
          points: result?.repoPoints ?? 0,
          stat: `${number.format(repositories)} repo có đóng góp`,
          detail:
            repositories >= 20
              ? "Đạt tối đa (≥20 repo)"
              : "Lũy tiến: 2=4, 5=8, 8=10, 12=12, 20=15",
        },
      ];

  return (
    <Paper withBorder radius="lg" p={{ base: "md", sm: "lg" }}>
      {/* Header Info */}
      <Group justify="space-between" align="center" gap="md" wrap="nowrap">
        <Group gap="md" wrap="nowrap" align="center">
          <div className="grid h-14 w-14 shrink-0 place-items-center sm:h-16 sm:w-16">
            <Image
              src={`/ranks/${rank.badge}.webp`}
              alt={`Huy hiệu ${rank.name}`}
              w={{
                base: 56,
                sm: 64,
              }}
              h={{
                base: 56,
                sm: 64,
              }}
              fit="contain"
              aria-hidden="true"
            />
          </div>
          <Box>
            <Text size="xs" fw={600} c="#71717a" tt="uppercase" lts={0.5}>
              Hạng hoạt động
              {scoreV3 ? ` · V${scoreV3.scoringVersion}` : " · 365 ngày"}
            </Text>
            <Text
              component="h3"
              fz={{ base: 22, sm: 26 }}
              fw={900}
              lh={1.2}
              mt={2}
              style={{
                color: rank.color,
                backgroundImage: rank.gradient,
                WebkitBackgroundClip: rank.gradient ? "text" : undefined,
                WebkitTextFillColor: rank.gradient ? "transparent" : undefined,
                filter: rank.color
                  ? `drop-shadow(0 2px 10px ${rank.color}35)`
                  : undefined,
              }}
            >
              {rank.name}
            </Text>
            <Text fz={13} c="#52525b" mt={3}>
              <span className="font-bold text-zinc-900">
                {scoreNumber.format(score)}
              </span>{" "}
              / 100 điểm
            </Text>
          </Box>
        </Group>

        <Box ta="right" className="shrink-0">
          <Text
            fz={{ base: 20, sm: 24 }}
            fw={800}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {activeWeeks == null ? "—" : number.format(activeWeeks)}
            {!scoreV3 && (
              <span className="text-xs font-normal text-zinc-400">/52</span>
            )}
          </Text>
          <Text fz={12} c="#71717a">
            tuần hoạt động
          </Text>
        </Box>
      </Group>

      {scoreV3?.provisional && (
        <Badge color="yellow" variant="light" mt="sm">
          Điểm tạm tính
        </Badge>
      )}

      {/* Main Unified Progress Bar (0 to 100) */}
      <Box mt="lg">
        <Progress
          size={10}
          radius="xl"
          color={rank.color}
          value={totalProgress}
          aria-label="Tiến độ điểm tổng"
          aria-valuetext={`${scoreNumber.format(score)} trên 100 điểm`}
        />

        {/* Status text with breathing room */}
        <Group justify="space-between" align="center" mt={8}>
          <Text fz={13} c="#52525b">
            {next ? (
              <>
                Còn{" "}
                <span className="font-semibold text-zinc-900">
                  {number.format(remaining)} điểm
                </span>{" "}
                để đạt hạng{" "}
                <span className="font-semibold" style={{ color: next.color }}>
                  {next.name}
                </span>
              </>
            ) : (
              <>
                Đã đạt hạng cao nhất · Còn{" "}
                <span className="font-semibold text-zinc-900">
                  {scoreNumber.format(Math.max(0, 100 - score))} điểm
                </span>{" "}
                để đạt điểm tuyệt đối 100/100
              </>
            )}
          </Text>

          <Text fz={12} fw={600} c="#71717a">
            {scoreNumber.format(score)}%
          </Text>
        </Group>
      </Box>

      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: scoreV3 ? 5 : 4 }}
        spacing="sm"
        mt="lg"
      >
        {criteria.map((item) => {
          const pct = item.maxPoints ? (item.points / item.maxPoints) * 100 : 0;
          const isMax = item.points >= item.maxPoints;
          return (
            <Box
              key={item.label}
              className="flex flex-col justify-between rounded-xl bg-zinc-50/80 p-3.5 transition-colors hover:bg-zinc-100/60"
            >
              <div>
                <Group justify="space-between" align="center" mb={6}>
                  <Text fz={12} fw={600} c="#52525b">
                    {item.label}
                  </Text>
                  <Badge
                    size="sm"
                    variant="light"
                    color={isMax ? "green" : "gray"}
                    radius="sm"
                  >
                    {scoreNumber.format(item.points)}/{item.maxPoints}đ
                  </Badge>
                </Group>
                <Text fz={15} fw={750} className="text-zinc-900" mt={2}>
                  {item.stat}
                </Text>
                <Text fz={11} c="#71717a" mt={2} lineClamp={1}>
                  {item.detail}
                </Text>
              </div>

              <div className="mt-3">
                <Progress
                  value={pct}
                  size={4}
                  radius="xl"
                  color={rank.color}
                  aria-label={`${item.label} tiến độ`}
                />
              </div>
            </Box>
          );
        })}
      </SimpleGrid>

      {/* Ranks Milestone Track */}
      <Box mt="lg" pt="sm" className="border-t border-zinc-100">
        <Group
          gap={4}
          justify="space-between"
          wrap="nowrap"
          className="overflow-x-auto"
        >
          {ranks.map((item) => {
            const isReached = score >= item.minScore;
            const isCurrent = rank.name === item.name;
            return (
              <Tooltip
                key={item.name}
                label={`${item.name} (${item.minScore}đ): ${item.description}`}
                position="top"
                withArrow
              >
                <Box
                  ta="center"
                  aria-current={isCurrent ? "step" : undefined}
                  className={`min-w-0 flex-1 rounded-xl p-1.5 sm:p-2 transition-all ${
                    isCurrent
                      ? "bg-zinc-100 ring-1 ring-zinc-300"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  <div className="mx-auto grid h-9 w-9 place-items-center sm:h-11 sm:w-11">
                    <Image
                      src={`/ranks/${item.badge}.webp`}
                      alt=""
                      w={{ base: 28, sm: 38 }}
                      h={{ base: 28, sm: 38 }}
                      fit="contain"
                      mx="auto"
                      style={{
                        opacity: isReached ? 1 : 0.35,
                        filter: isReached ? undefined : "grayscale(0.7)",
                        transform: isCurrent ? "scale(1.06)" : undefined,
                      }}
                    />
                  </div>
                  <Text
                    fz={{ base: 9.5, sm: 11 }}
                    fw={isCurrent ? 750 : isReached ? 600 : 500}
                    c={isReached ? item.color : "#71717a"}
                    lineClamp={1}
                    mt={4}
                  >
                    {item.name}
                  </Text>
                  <Text fz={{ base: 9, sm: 10 }} c="#a1a1aa" mt={1}>
                    ≥{number.format(item.minScore)}đ
                  </Text>
                </Box>
              </Tooltip>
            );
          })}
        </Group>

        {scoreV3 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold">
              Chi tiết cách tính điểm
            </summary>
            {scoreV3.collection?.status === "stale" && (
              <Text size="xs">
                Đang sử dụng dữ liệu cache từ lần thu thập trước.
              </Text>
            )}
            {(scoreV3.collection?.restricted ||
              scoreV3.collection?.status === "restricted") && (
              <Text size="xs">
                Dữ liệu đóng góp giới hạn theo quyền truy cập.
              </Text>
            )}
            {scoreV3.bounds && !scoreV3.bounds.scoreResolved && (
              <Text size="xs" mt="xs">
                Khoảng điểm có thể xác nhận{" "}
                {scoreNumber.format(scoreV3.bounds.minimum)}–
                {scoreNumber.format(scoreV3.bounds.maximum)}.{" "}
                {scoreV3.bounds.rankResolved
                  ? "Hạng đã xác định."
                  : "Hạng còn tạm tính."}
              </Text>
            )}
            {role && (
              <Box mt="md">
                <Group justify="space-between">
                  <Text fw={700} size="sm">
                    Cộng tác
                  </Text>
                  <Text fw={700} size="sm">
                    {scoreNumber.format(role.points)}/15 điểm
                  </Text>
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt={6}>
                  {(
                    [
                      ["Đánh giá PR", role.review],
                      ["Vai trò đóng góp", role.contributor],
                      ["Vai trò tích hợp", role.maintainer],
                      ["Giải quyết issue", role.issues],
                    ] as const
                  ).map(([title, component]) => (
                    <Box
                      key={title}
                      className="rounded-md border border-zinc-200 px-3 py-2"
                    >
                      <Group justify="space-between" gap={4}>
                        <Text fw={600} size="xs">
                          {title}
                        </Text>
                        <Text size="xs">
                          {scoreNumber.format(component.points)}/
                          {component.ceiling}đ
                        </Text>
                      </Group>
                      {component.metrics.map((metric) => (
                        <Text key={metric.id} size="xs" mt={3}>
                          {roleMetricLabels[metric.id]} ·{" "}
                          {metric.raw == null
                            ? "Chưa có dữ liệu"
                            : number.format(metric.raw)}
                          {metric.availability === "partial"
                            ? " quan sát được"
                            : ""}
                        </Text>
                      ))}
                    </Box>
                  ))}
                </SimpleGrid>
                <Text size="xs" mt="xs">
                  Điểm vai trò cộng tác{" "}
                  {scoreNumber.format(role.sharedRole.points)}/7. Điểm này lấy
                  theo vai trò có điểm cao hơn.
                </Text>
                {role.minimum !== role.maximum && (
                  <Text size="xs">
                    Khoảng điểm cộng tác {scoreNumber.format(role.minimum)}–
                    {scoreNumber.format(role.maximum)}/15.
                  </Text>
                )}
              </Box>
            )}
            {scoreV3.categories
              .filter((category) => !role || category.id !== "collaboration")
              .map((category) => (
                <Box key={category.id} mt="sm">
                  <Text fw={600} size="sm">
                    {labels[category.id]}
                  </Text>
                  <ul className="list-disc pl-5">
                    {category.metrics.map((metric) => (
                      <li key={metric.id}>
                        <Text size="xs">
                          {metric.explanation} ·{" "}
                          {metric.raw === null
                            ? "Chưa có dữ liệu"
                            : `${scoreNumber.format(metric.raw)} → ${scoreNumber.format(metric.adjusted ?? 0)}`}
                          {metric.availability === "partial"
                            ? metric.scoreResolved
                              ? " (đã xác định điểm)"
                              : " (một phần)"
                            : ""}
                          {" · "}
                          {scoreNumber.format(metric.points)}/{metric.maximum}đ
                          {" · Ngưỡng "}
                          {number.format(metric.threshold)}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </Box>
              ))}
            {scoreV3.adjustments.map((item) => (
              <Text key={item.rule} size="xs" mt="xs">
                {item.explanation} {scoreNumber.format(item.original)} →{" "}
                {scoreNumber.format(item.adjusted)}.
              </Text>
            ))}
            {scoreV3.completeness.limitations.map((item) => (
              <Text key={item} size="xs" mt="xs">
                {item}
              </Text>
            ))}
          </details>
        )}
      </Box>
    </Paper>
  );
}
