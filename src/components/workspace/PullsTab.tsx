"use client";

import {
  Box,
  Group,
  Pagination,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconGitMerge,
  IconGitPullRequest,
  IconMessageCircle,
  IconSearch,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { PullDetailView } from "./pulls/PullDetailView";

interface PullsTabProps {
  onPullsLoaded?: (count: number) => void;
}

export function PullsTab({ onPullsLoaded }: PullsTabProps) {
  const { selectedRepo } = useDashboardStore();
  const [pulls, setPulls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");

  // State phân trang & tổng số PR thực tế
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [selectedPullNumber, setSelectedPullNumber] = useState<number | null>(
    null,
  );

  const fetchPulls = () => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(
        `/api/github/pulls?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&state=${filter}&page=${page}&per_page=15`,
      )
      .then((res) => {
        const data = res.data.pulls || [];
        const count = res.data.totalCount ?? data.length;
        setPulls(data);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(count);
        // Chỉ cập nhật badge số lượng open PRs khi filter là 'open'
        if (onPullsLoaded && filter === "open") {
          onPullsLoaded(count);
        }
      })
      .catch((err) => console.error("Lỗi tải PRs:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPulls();
  }, [selectedRepo?.id, filter, page]);

  const filteredPulls = useMemo(() => {
    if (!searchQuery.trim()) return pulls;
    const q = searchQuery.toLowerCase();
    return pulls.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.user?.login?.toLowerCase().includes(q) ||
        String(item.number).includes(q),
    );
  }, [pulls, searchQuery]);

  if (selectedPullNumber) {
    return (
      <PullDetailView
        pullNumber={selectedPullNumber}
        onBack={() => setSelectedPullNumber(null)}
        onMergedSuccess={() => {
          fetchPulls();
          setSelectedPullNumber(null);
        }}
      />
    );
  }

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px 20px",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <Box style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Bộ lọc và Tìm kiếm */}
        <Group justify="space-between" mb="md" gap="sm" wrap="wrap">
          <Group gap="sm" wrap="wrap">
            <TextInput
              placeholder="Tìm kiếm Pull Request..."
              leftSection={<IconSearch size={14} color="#94a3b8" />}
              size="xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ width: 280 }}
              styles={{
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
              }}
            />

            <SegmentedControl
              value={filter}
              onChange={(val) => {
                setFilter(val as any);
                setPage(1);
              }}
              size="xs"
              data={[
                { label: "Open", value: "open" },
                { label: "Closed", value: "closed" },
                { label: "All", value: "all" },
              ]}
              styles={{
                root: { backgroundColor: "#f1f5f9" },
                indicator: {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                },
                label: { color: "#334155", fontWeight: 600, fontSize: 11 },
              }}
            />
          </Group>

          <Text fz="xs" c="#64748b">
            {searchQuery.trim()
              ? `Tìm thấy ${filteredPulls.length} PRs (trong ${totalCount} PRs)`
              : `Trang ${page} / ${totalPages} (${totalCount} PRs)`}
          </Text>
        </Group>

        {/* Danh sách Pulls */}
        {loading ? (
          <Stack
            gap={1}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                p="sm"
                bg="#ffffff"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Group gap="sm" style={{ flex: 1 }}>
                  <Skeleton height={20} width={20} circle />
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Skeleton height={15} width="60%" radius="sm" />
                    <Skeleton height={11} width="35%" radius="sm" />
                  </Stack>
                </Group>
                <Skeleton height={18} width={50} radius="sm" />
              </Box>
            ))}
          </Stack>
        ) : filteredPulls.length > 0 ? (
          <Stack
            gap={1}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {filteredPulls.map((pr) => {
              const isMerged = !!pr.merged_at;
              const isOpen = pr.state === "open";

              return (
                <Box
                  key={pr.id}
                  p="sm"
                  onClick={() => setSelectedPullNumber(pr.number)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    cursor: "pointer",
                    transition: "background-color 0.12s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#ffffff")
                  }
                >
                  <Box mt={2}>
                    {isMerged ? (
                      <IconGitMerge size={16} color="#7c3aed" />
                    ) : isOpen ? (
                      <IconGitPullRequest size={16} color="#16a34a" />
                    ) : (
                      <IconGitPullRequest size={16} color="#dc2626" />
                    )}
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fz="sm" fw={600} c="#0f172a">
                      {pr.title}
                    </Text>

                    <Text fz={11} c="#64748b" mt={4}>
                      #{pr.number} mở bởi{" "}
                      <span style={{ color: "#334155", fontWeight: 500 }}>
                        {pr.user?.login}
                      </span>{" "}
                      • {new Date(pr.created_at).toLocaleDateString()}
                    </Text>
                  </Box>

                  {pr.comments > 0 && (
                    <Group gap={4} c="#64748b">
                      <IconMessageCircle size={14} />
                      <Text fz={11}>{pr.comments}</Text>
                    </Group>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box ta="center" mt={60} px="md">
            <IconGitPullRequest
              size={38}
              color="#94a3b8"
              style={{ margin: "0 auto 10px" }}
            />
            <Text fz="sm" fw={500} c="#0f172a">
              Không có Pull Request nào
            </Text>
            <Text fz="xs" c="#64748b" mt={4}>
              Tất cả các thay đổi đã được xử lý hoặc chưa có PR nào được tạo.
            </Text>
          </Box>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <Group justify="center" mt="xl">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
              radius="md"
            />
          </Group>
        )}
      </Box>
    </Box>
  );
}
