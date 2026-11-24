"use client";

import {
  Alert,
  Badge,
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
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconCircleCheck,
  IconCircleDot,
  IconMessageCircle,
  IconSearch,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";

interface IssuesTabProps {
  onIssuesLoaded?: (count: number) => void;
}

export function IssuesTab({ onIssuesLoaded }: IssuesTabProps) {
  const selectedRepo = useDashboardStore((state) => state.selectedRepo);
  const login = useAuthStore((state) => state.user?.login);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [query] = useDebouncedValue(searchQuery.trim(), 300);
  const [page, setPage] = useState(1);

  const params =
    selectedRepo &&
    new URLSearchParams({
      owner: selectedRepo.owner.login,
      repo: selectedRepo.name,
      state: filter,
      page: String(page),
      q: query,
    });
  const {
    data,
    error,
    isLoading: loading,
    mutate,
  } = useSWR(
    params && login ? [`/api/github/issues?${params}`, login] : null,
    async ([url]) => (await axios.get(url)).data,
    { errorRetryCount: 1 },
  );
  const filteredIssues = (data?.items ?? data?.issues ?? []) as any[];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const unfilteredOpenCount =
    data && filter === "open" && !query ? totalCount : null;
  useEffect(() => {
    if (unfilteredOpenCount !== null) onIssuesLoaded?.(unfilteredOpenCount);
  }, [unfilteredOpenCount, onIssuesLoaded]);

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
              placeholder="Tìm kiếm Issue..."
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
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
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
              ? `Tìm thấy ${totalCount} issues`
              : `Trang ${page} / ${totalPages} · ${totalCount} issues`}
          </Text>
        </Group>

        {data?.incomplete && (
          <Alert color="yellow" mb="sm">
            GitHub trả kết quả tìm kiếm giới hạn. Hãy thu hẹp bộ lọc.
          </Alert>
        )}
        {/* Danh sách Issues */}
        {error ? (
          <Alert color="red" title="Không thể tải Issues">
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
        ) : filteredIssues.length > 0 ? (
          <Stack
            gap={1}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {filteredIssues.map((issue) => {
              const isOpen = issue.state === "open";

              return (
                <Box
                  key={issue.id}
                  p="sm"
                  component="a"
                  href={issue.html_url}
                  target="_blank"
                  style={{
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    textDecoration: "none",
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
                    {isOpen ? (
                      <IconCircleDot size={16} color="#16a34a" />
                    ) : (
                      <IconCircleCheck size={16} color="#7c3aed" />
                    )}
                  </Box>

                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" wrap="wrap">
                      <Text fz="sm" fw={600} c="#0f172a">
                        {issue.title}
                      </Text>
                      {issue.labels?.map((label: any) => (
                        <Badge
                          key={label.id}
                          size="xs"
                          variant="light"
                          style={{
                            backgroundColor: `#${label.color}25`,
                            color: `#${label.color}`,
                            border: `1px solid #${label.color}40`,
                          }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </Group>

                    <Text fz={11} c="#64748b" mt={4}>
                      #{issue.number} mở bởi{" "}
                      <span style={{ color: "#334155", fontWeight: 500 }}>
                        {issue.user?.login}
                      </span>{" "}
                      • {new Date(issue.created_at).toLocaleDateString()}
                    </Text>
                  </Box>

                  {issue.comments > 0 && (
                    <Group gap={4} c="#64748b">
                      <IconMessageCircle size={14} />
                      <Text fz={11}>{issue.comments}</Text>
                    </Group>
                  )}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box ta="center" mt={60} px="md">
            <IconCircleDot
              size={38}
              color="#94a3b8"
              style={{ margin: "0 auto 10px" }}
            />
            <Text fz="sm" fw={500} c="#0f172a">
              Không có Issue nào
            </Text>
            <Text fz="xs" c="#64748b" mt={4}>
              Repository hiện tại không có lỗi hay yêu cầu tính năng mở nào.
            </Text>
          </Box>
        )}
        {totalPages > 1 && (
          <Pagination
            mt="md"
            value={page}
            onChange={setPage}
            total={totalPages}
          />
        )}
      </Box>
    </Box>
  );
}
