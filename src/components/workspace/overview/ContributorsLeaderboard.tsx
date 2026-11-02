"use client";

import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Group,
  Paper,
  Progress,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconGitMerge,
  IconGitPullRequest,
  IconInfoCircle,
  IconRefresh,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import { formatCompactNumber } from "@/lib/time";

interface ContributorsLeaderboardProps {
  rankedContributors: any[];
  statsData: any;
  loadingStats: boolean;
  refreshing: boolean;
  fetchStats: (force?: boolean) => void;
  sortBy: "impact" | "prs" | "lines" | "commits";
  setSortBy: (val: "impact" | "prs" | "lines" | "commits") => void;
}

export function ContributorsLeaderboard({
  rankedContributors,
  statsData,
  loadingStats,
  refreshing,
  fetchStats,
  sortBy,
  setSortBy,
}: ContributorsLeaderboardProps) {
  return (
    <Box mb="xl">
      <Group justify="space-between" align="center" mb="xs" wrap="wrap">
        <Group gap="xs">
          <IconUsers size={16} color="#fb291a" />
          <Text fz="sm" fw={700} c="#0f172a">
            Đóng góp của các thành viên
          </Text>
          <Badge size="xs" variant="outline" color="gray">
            {statsData.totalContributors
              ? `${rankedContributors.length} / ${formatCompactNumber(statsData.totalContributors)} members`
              : `${rankedContributors.length} members`}
          </Badge>
          <Tooltip label="Làm mới số liệu (Xóa cache GitHub)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xs"
              loading={refreshing}
              onClick={() => fetchStats(true)}
              aria-label="Làm mới thống kê"
            >
              <IconRefresh size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <SegmentedControl
          size="xs"
          value={sortBy}
          onChange={(val) => setSortBy(val as any)}
          data={[
            { label: "Tác động (Impact)", value: "impact" },
            { label: "PRs chấp nhận", value: "prs" },
            { label: "Dòng code (+ / -)", value: "lines" },
            { label: "Số commit", value: "commits" },
          ]}
          styles={{
            root: { backgroundColor: "#f1f5f9" },
            indicator: {
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            },
            label: { color: "#334155", fontSize: 11, fontWeight: 500 },
          }}
        />
      </Group>

      <Group gap={6} mb="sm" c="#64748b">
        <IconInfoCircle size={13} />
        <Text fz={11}>
          {sortBy === "impact" &&
            "Điểm Impact Score kết hợp: PRs đã được duyệt merge (30đ) + Chu kỳ Commit (2đ) + Quy mô dòng code."}
          {sortBy === "prs" &&
            "Xếp hạng theo số Pull Request đã được chấp nhận (Merged PRs) vào codebase."}
          {sortBy === "lines" &&
            "Xếp hạng theo tổng dung lượng dòng code can thiệp (+thêm / -xóa)."}
          {sortBy === "commits" &&
            "Xếp hạng theo số lượng commits truyền thống."}
        </Text>
      </Group>

      <Paper
        radius="md"
        bg="#ffffff"
        style={{
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {loadingStats ? (
          <Stack gap={0} p="md">
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                py="sm"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: i < 3 ? "1px solid #f1f5f9" : "none",
                }}
              >
                <Group gap="md">
                  <Skeleton height={14} width={16} radius="sm" />
                  <Skeleton height={36} width={36} circle />
                  <Stack gap={4}>
                    <Skeleton height={14} width={120} radius="sm" />
                    <Skeleton height={10} width={80} radius="sm" />
                  </Stack>
                </Group>
                <Group gap="xl">
                  <Skeleton height={14} width={60} radius="sm" />
                  <Skeleton height={14} width={60} radius="sm" />
                </Group>
              </Box>
            ))}
          </Stack>
        ) : rankedContributors.length > 0 ? (
          <Stack gap={0}>
            {rankedContributors.map((c, index) => {
              const author = c.author || {};
              const isTop1 = index === 0;

              return (
                <Box
                  key={author.id || index}
                  p="md"
                  style={{
                    borderBottom:
                      index === rankedContributors.length - 1
                        ? "none"
                        : "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <Group
                    gap="md"
                    wrap="nowrap"
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Text
                      fz="xs"
                      fw={700}
                      c={isTop1 ? "#d97706" : "#64748b"}
                      w={16}
                      ta="center"
                      ff="monospace"
                    >
                      #{index + 1}
                    </Text>
                    <Avatar
                      src={author.avatar_url}
                      size={36}
                      radius="xl"
                      style={{ border: "1px solid #e2e8f0" }}
                    />
                    <Box style={{ overflow: "hidden" }}>
                      <Group gap={6} wrap="nowrap">
                        <Text
                          component="a"
                          href={author.html_url}
                          target="_blank"
                          fz="sm"
                          fw={600}
                          c="#0f172a"
                          style={{
                            textDecoration: "none",
                            "&:hover": { color: "#fb291a" },
                          }}
                          truncate
                        >
                          {author.name && author.name !== author.login ? (
                            <>
                              {author.name}{" "}
                              <span
                                style={{
                                  color: "#64748b",
                                  fontSize: 12,
                                  fontWeight: 400,
                                }}
                              >
                                (@{author.login})
                              </span>
                            </>
                          ) : (
                            author.login || "Unknown"
                          )}
                        </Text>
                        {isTop1 && (
                          <Badge
                            size="xs"
                            color="yellow"
                            variant="light"
                            leftSection={<IconSparkles size={11} />}
                          >
                            Dẫn đầu
                          </Badge>
                        )}
                      </Group>

                      <Group gap={8} mt={4} wrap="wrap">
                        {c.mergedByCount > 0 && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="cyan"
                            leftSection={<IconGitMerge size={11} />}
                          >
                            {c.mergedPRs === 0 ? "Nhóm trưởng • " : ""}Đã duyệt{" "}
                            {c.mergedByCount} PRs
                          </Badge>
                        )}

                        {c.mergedPRs > 0 ? (
                          <Badge
                            size="xs"
                            variant="outline"
                            color="violet"
                            leftSection={<IconGitPullRequest size={11} />}
                          >
                            {c.mergedPRs} PRs đã merge
                          </Badge>
                        ) : c.commits > 0 ? (
                          <Badge size="xs" variant="outline" color="gray">
                            Direct Committer
                          </Badge>
                        ) : c.mergedByCount === 0 ? (
                          <Badge size="xs" variant="outline" color="cyan">
                            {c.role || "Collaborator"}
                          </Badge>
                        ) : null}

                        {c.linesChanged > 0 ? (
                          <Tooltip
                            label={`+${(c.additions || 0).toLocaleString()} thêm / -${(c.deletions || 0).toLocaleString()} xóa (${(c.linesChanged || 0).toLocaleString()} dòng thay đổi)`}
                            withArrow
                          >
                            <Text fz={11} c="#64748b" ff="monospace">
                              <span style={{ color: "#16a34a" }}>
                                +{formatCompactNumber(c.additions || 0)}
                              </span>{" "}
                              /{" "}
                              <span style={{ color: "#dc2626" }}>
                                -{formatCompactNumber(c.deletions || 0)}
                              </span>{" "}
                              dòng
                            </Text>
                          </Tooltip>
                        ) : (
                          <Text fz={11} c="#64748b" ff="monospace">
                            0 dòng thay đổi
                          </Text>
                        )}

                        <Text fz={11} c="#64748b">
                          • {formatCompactNumber(c.commits || 0)} commits
                        </Text>
                      </Group>
                    </Box>
                  </Group>

                  <Box style={{ width: 140 }} visibleFrom="sm">
                    <Progress
                      value={c.percent}
                      size={6}
                      radius="xl"
                      color={isTop1 ? "yellow" : "indigo"}
                    />
                  </Box>

                  <Badge
                    size="sm"
                    variant="subtle"
                    color={isTop1 ? "yellow" : "gray"}
                    ff="monospace"
                  >
                    {sortBy === "impact" && `${c.impactScore ?? 0} pts`}
                    {sortBy === "prs" &&
                      `${c.mergedPRs > 0 ? `${c.mergedPRs} PRs tạo` : `${c.mergedByCount} PRs duyệt`}`}
                    {sortBy === "lines" &&
                      `${formatCompactNumber(c.linesChanged ?? 0)} dòng`}
                    {sortBy === "commits" &&
                      `${formatCompactNumber(c.commits ?? 0)} commits`}
                  </Badge>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box p="xl" ta="center">
            <Text fz="xs" c="#64748b">
              Chưa có dữ liệu thành viên đóng góp từ GitHub Stats API.
            </Text>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
