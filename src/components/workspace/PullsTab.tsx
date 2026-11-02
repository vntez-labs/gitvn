"use client";

import {
  Box,
  Button,
  Group,
  Pagination,
  SegmentedControl,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconGitPullRequest, IconPlus, IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { CreatePullModal } from "./pulls/CreatePullModal";
import { PullDetailView } from "./pulls/PullDetailView";
import { PullListItem } from "./pulls/PullListItem";

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
  const [createModalOpen, setCreateModalOpen] = useState(false);

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
        backgroundColor: "#faf8f6",
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
                  borderColor: "#e5e1da",
                  color: "#1f1c19",
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
                root: { backgroundColor: "#f5f3ee" },
                indicator: {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 1px 3px rgba(31, 28, 25, 0.1)",
                },
                label: { color: "#1f1c19", fontWeight: 600, fontSize: 11 },
              }}
            />
          </Group>

          <Group gap="sm" align="center">
            <Text fz="xs" c="#6e675f">
              {searchQuery.trim()
                ? `Tìm thấy ${filteredPulls.length} PRs (trong ${totalCount} PRs)`
                : `Trang ${page} / ${totalPages} (${totalCount} PRs)`}
            </Text>

            <Button
              size="xs"
              color="vntez"
              leftSection={<IconPlus size={14} />}
              onClick={() => setCreateModalOpen(true)}
            >
              Tạo Pull Request
            </Button>
          </Group>
        </Group>

        {/* Danh sách Pulls */}
        {loading ? (
          <Stack
            gap={1}
            style={{
              border: "1px solid #e8e5de",
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
                  borderBottom: "1px solid #f5f3ee",
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
              border: "1px solid #e8e5de",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {filteredPulls.map((pr) => (
              <PullListItem
                key={pr.id}
                pr={pr}
                onClick={() => setSelectedPullNumber(pr.number)}
              />
            ))}
          </Stack>
        ) : (
          <Box ta="center" mt={60} px="md">
            <IconGitPullRequest
              size={38}
              color="#94a3b8"
              style={{ margin: "0 auto 10px" }}
            />
            <Text fz="sm" fw={500} c="#1f1c19">
              Không có Pull Request nào
            </Text>
            <Text fz="xs" c="#6e675f" mt={4}>
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

      {selectedRepo && (
        <CreatePullModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          defaultBase={(selectedRepo as any).default_branch || "main"}
          onSuccess={(newNum) => {
            fetchPulls();
            setSelectedPullNumber(newNum);
          }}
        />
      )}
    </Box>
  );
}
