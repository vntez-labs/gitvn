"use client";

import {
  Alert,
  Box,
  Button,
  Group,
  Pagination,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconGitPullRequest, IconPlus, IconSearch } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { CreatePullModal } from "./pulls/CreatePullModal";
import { PullDetailView } from "./pulls/PullDetailView";
import { PullListItem, type PullListItemProps } from "./pulls/PullListItem";

interface PullsTabProps {
  initialPull?: number;
  onPullOpened?: (number: number | null) => void;
  onPullsLoaded?: (count: number) => void;
}

export function PullsTab({
  initialPull,
  onPullOpened,
  onPullsLoaded,
}: PullsTabProps) {
  const selectedRepo = useDashboardStore((state) => state.selectedRepo);
  const login = useAuthStore((state) => state.user?.login);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [query] = useDebouncedValue(searchQuery.trim(), 300);
  const [page, setPage] = useState(1);
  const [selectedPullNumber, setSelectedPullNumber] = useState<number | null>(
    initialPull ?? null,
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const params =
    selectedRepo &&
    new URLSearchParams({
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      state: filter,
      page: String(page),
      q: query,
      view: view || "",
      login: login || "",
    });
  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR(
    params && login ? [`/api/github/pulls?${params}`, login] : null,
    async ([url]) => (await axios.get(url)).data,
    { errorRetryCount: 1 },
  );
  const filteredPulls = (data?.items ??
    data?.pulls ??
    []) as PullListItemProps["pr"][];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const unfilteredOpenCount =
    data && filter === "open" && !query && !view ? totalCount : null;
  useEffect(() => {
    if (unfilteredOpenCount !== null) onPullsLoaded?.(unfilteredOpenCount);
  }, [unfilteredOpenCount, onPullsLoaded]);

  function openPull(number: number | null) {
    setSelectedPullNumber(number);
    onPullOpened?.(number);
  }

  if (selectedPullNumber) {
    return (
      <PullDetailView
        key={`${selectedRepo?.id}:${selectedPullNumber}`}
        pullNumber={selectedPullNumber}
        onBack={() => openPull(null)}
        onMergedSuccess={() => void mutate()}
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
              onChange={(e) => {
                setSearchQuery(e.currentTarget.value);
                setPage(1);
              }}
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
                setFilter(val as typeof filter);
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
            <Select
              size="xs"
              aria-label="Lọc theo người dùng"
              placeholder="Tất cả PR"
              value={view}
              clearable
              onChange={(value) => {
                setView(value);
                setPage(1);
                if (value === "review") setFilter("open");
              }}
              data={[
                { value: "mine", label: "PR của tôi" },
                { value: "review", label: "Chờ tôi review" },
              ]}
            />
            <Text fz="xs" c="#6e675f">
              {searchQuery.trim()
                ? `Tìm thấy ${totalCount} PRs`
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

        {data?.incomplete && (
          <Alert color="yellow" mb="sm">
            GitHub trả kết quả tìm kiếm giới hạn. Hãy thu hẹp bộ lọc.
          </Alert>
        )}
        {/* Danh sách Pulls */}
        {error ? (
          <Alert color="red" title="Không thể tải Pull Requests">
            {axios.isAxiosError(error)
              ? error.response?.data?.error || error.message
              : "Lỗi kết nối GitHub."}
            <Button
              ml="sm"
              size="compact-xs"
              variant="subtle"
              onClick={() => void mutate()}
            >
              Thử lại
            </Button>
          </Alert>
        ) : loading ? (
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
                onClick={() => openPull(pr.number)}
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
          defaultBase={selectedRepo.default_branch || "main"}
          onSuccess={(newNum) => {
            void mutate();
            openPull(newNum);
          }}
        />
      )}
    </Box>
  );
}
