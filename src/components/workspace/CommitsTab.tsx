"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconGitBranch,
  IconGitCommit,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { CommitDetailModal } from "./CommitDetailModal";
import { CommitGraphRow } from "./commits/CommitGraphRow";

interface CommitsTabProps {
  onCommitsLoaded?: (count: number) => void;
}

export function CommitsTab({ onCommitsLoaded }: CommitsTabProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCommits = () => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(
          currentBranch,
        )}`,
      )
      .then((res) => {
        const data = res.data.commits || [];
        setCommits(data);
        if (onCommitsLoaded) {
          onCommitsLoaded(data.length);
        }
      })
      .catch((err) => console.error("Lỗi tải danh sách commits:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCommits();
  }, [selectedRepo?.id, currentBranch]);

  // Bộ lọc tìm kiếm commit
  const filteredCommits = useMemo(() => {
    if (!searchQuery.trim()) return commits;
    const q = searchQuery.toLowerCase();
    return commits.filter(
      (c) =>
        c.commit?.message?.toLowerCase().includes(q) ||
        c.commit?.author?.name?.toLowerCase().includes(q) ||
        c.author?.login?.toLowerCase().includes(q) ||
        c.sha?.toLowerCase().startsWith(q),
    );
  }, [commits, searchQuery]);

  if (!selectedRepo) return null;

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px",
        minHeight: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <Box style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Thanh công cụ tìm kiếm và thông tin nhánh */}
        <Group justify="space-between" mb="md" gap="sm" wrap="wrap">
          <Group gap="xs">
            <TextInput
              placeholder="Tìm kiếm commit theo thông điệp, tác giả hoặc SHA..."
              leftSection={<IconSearch size={14} color="#94a3b8" />}
              size="xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ width: 340 }}
              styles={{
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
              }}
            />

            <Tooltip label="Làm mới lịch sử commit" withArrow>
              <ActionIcon
                size="input-xs"
                variant="default"
                onClick={fetchCommits}
                loading={loading}
                aria-label="Làm mới"
              >
                <IconRefresh size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Group gap="xs">
            <Group gap={6} align="center">
              <IconGitBranch size={14} color="#64748b" />
              <Text fz="xs" c="#64748b">
                Nhánh:{" "}
                <span
                  style={{
                    color: "#fb291a",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {currentBranch}
                </span>
              </Text>
            </Group>

            <Badge size="sm" variant="light" color="gray">
              {filteredCommits.length} commits
            </Badge>
          </Group>
        </Group>

        {/* Biểu đồ Commit Graph & Danh sách Commits */}
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
                p="md"
                bg="#ffffff"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Group gap="sm" style={{ flex: 1 }}>
                  <Skeleton height={28} width={28} circle />
                  <Stack gap={4} style={{ flex: 1 }}>
                    <Skeleton height={14} width="55%" radius="sm" />
                    <Skeleton height={11} width="35%" radius="sm" />
                  </Stack>
                </Group>
                <Skeleton height={22} width={70} radius="sm" />
              </Box>
            ))}
          </Stack>
        ) : filteredCommits.length > 0 ? (
          <Box
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            }}
          >
            {filteredCommits.map((item, index) => (
              <CommitGraphRow
                key={item.sha}
                item={item}
                index={index}
                total={filteredCommits.length}
                currentBranch={currentBranch}
                onSelect={(sha) => {
                  setSelectedSha(sha);
                  setModalOpen(true);
                }}
              />
            ))}
          </Box>
        ) : (
          <Box ta="center" mt={60} px="md">
            <IconGitCommit
              size={38}
              color="#94a3b8"
              style={{ margin: "0 auto 10px" }}
            />
            <Text fz="sm" fw={500} c="#0f172a">
              Không tìm thấy commit nào phù hợp
            </Text>
            <Text fz="xs" c="#64748b" mt={4}>
              Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc đổi sang nhánh khác.
            </Text>
          </Box>
        )}
      </Box>

      {/* Modal chi tiết commit */}
      {selectedRepo && (
        <CommitDetailModal
          opened={modalOpen}
          onClose={() => setModalOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          sha={selectedSha}
          branch={currentBranch}
        />
      )}
    </Box>
  );
}
