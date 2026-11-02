"use client";

import { Box, Button, Group, Skeleton, Stack, Text } from "@mantine/core";
import { IconGitCommit } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CommitDetailModal } from "@/components/workspace/CommitDetailModal";
import { computeGitGraphLayout } from "@/lib/git-graph-layout";
import { useDashboardStore } from "@/store/dashboard.store";
import { CommitGraphRow } from "./commits/CommitGraphRow";
import { CommitsToolbar } from "./commits/CommitsToolbar";

interface CommitsTabProps {
  onCommitsLoaded?: (count: number) => void;
}

export function CommitsTab({ onCommitsLoaded }: CommitsTabProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [authorFilter, setAuthorFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branchList, setBranchList] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Tải danh sách branches của repo
  useEffect(() => {
    if (!selectedRepo) return;
    axios
      .get(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`,
      )
      .then((res) => {
        const list = (res.data.branches || []).map((b: any) => b.name);
        if (list.length > 0) setBranchList(list);
      })
      .catch(() => {});
  }, [selectedRepo?.id]);

  const fetchCommits = (targetPage = 1, append = false) => {
    if (!selectedRepo) return;
    if (append) setLoadingMore(true);
    else setLoading(true);

    axios
      .get(
        `/api/github/commits?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}&branch=${encodeURIComponent(
          branchFilter,
        )}&page=${targetPage}&per_page=100`,
      )
      .then((res) => {
        const data = res.data.commits || [];
        if (append) {
          setCommits((prev) => {
            const map = new Map<string, any>();
            prev.forEach((c) => map.set(c.sha, c));
            data.forEach((c: any) => map.set(c.sha, c));
            return Array.from(map.values());
          });
        } else {
          setCommits(data);
          if (onCommitsLoaded) onCommitsLoaded(data.length);
        }
        setHasMore(data.length >= 30);
        setPage(targetPage);
      })
      .catch((err) => console.error("Lỗi tải danh sách commits:", err))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    setPage(1);
    fetchCommits(1, false);
  }, [selectedRepo?.id, branchFilter]);

  // Danh sách các tác giả đã commit trong repo
  const authorOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();
    commits.forEach((c) => {
      const name = c.commit?.author?.name || c.author?.login;
      const val = c.author?.login || c.commit?.author?.name;
      if (val && !map.has(val.toLowerCase())) {
        map.set(val.toLowerCase(), {
          label: name && name !== val ? `${name} (@${val})` : name || val,
          value: val,
        });
      }
    });
    return [
      { label: "Tất cả tác giả (All contributors)", value: "all" },
      ...Array.from(map.values()),
    ];
  }, [commits]);

  // Danh sách branches cho dropdown
  const branchOptions = useMemo(() => {
    const unique = Array.from(
      new Set(["all", currentBranch, ...branchList]),
    ).filter(Boolean);
    return unique.map((b) => ({
      value: b,
      label: b === "all" ? "Tất cả các nhánh (All branches)" : `Nhánh: ${b}`,
    }));
  }, [branchList, currentBranch]);

  // Bộ lọc tìm kiếm commit & lọc tác giả
  const filteredCommits = useMemo(() => {
    return commits.filter((c) => {
      if (authorFilter !== "all") {
        const qAuth = authorFilter.toLowerCase();
        const authorMatch =
          c.author?.login?.toLowerCase() === qAuth ||
          c.commit?.author?.name?.toLowerCase() === qAuth;
        if (!authorMatch) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.commit?.message?.toLowerCase().includes(q) ||
        c.commit?.author?.name?.toLowerCase().includes(q) ||
        c.author?.login?.toLowerCase().includes(q) ||
        c.sha?.toLowerCase().startsWith(q)
      );
    });
  }, [commits, authorFilter, searchQuery]);

  // Tính toán layout biểu đồ multi-lane DAG chuẩn GitLens
  const graphLayout = useMemo(() => {
    return computeGitGraphLayout(filteredCommits);
  }, [filteredCommits]);

  if (!selectedRepo) return null;

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 24px",
        minHeight: 0,
        backgroundColor: "#faf8f6",
      }}
    >
      <Box style={{ maxWidth: 1060, margin: "0 auto" }}>
        {/* Toolbar lọc và tìm kiếm */}
        <CommitsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          branchOptions={branchOptions}
          branchFilter={branchFilter}
          onBranchChange={setBranchFilter}
          authorOptions={authorOptions}
          authorFilter={authorFilter}
          onAuthorChange={setAuthorFilter}
          onRefresh={() => fetchCommits(1, false)}
          loading={loading}
          totalCommits={filteredCommits.length}
        />

        {/* Biểu đồ Commit Graph & Danh sách Commits */}
        {loading ? (
          <Stack
            gap={1}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e8e5de",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Box
                key={i}
                p="xs"
                style={{
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #f1ede6",
                }}
              >
                <Group gap="md" style={{ flex: 1 }}>
                  <Skeleton height={14} width={14} circle />
                  <Skeleton height={14} width="45%" radius="sm" />
                </Group>
                <Skeleton height={14} width={80} radius="sm" />
              </Box>
            ))}
          </Stack>
        ) : filteredCommits.length > 0 ? (
          <Stack gap={0}>
            <Box
              style={{
                border: "1px solid #e8e5de",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(31, 28, 25, 0.04)",
              }}
            >
              {filteredCommits.map((item, index) => (
                <CommitGraphRow
                  key={item.sha}
                  item={item}
                  layout={graphLayout[index]}
                  currentBranch={currentBranch}
                  onSelect={(sha) => {
                    setSelectedSha(sha);
                    setModalOpen(true);
                  }}
                />
              ))}
            </Box>

            {/* Nút tải thêm commits nếu có */}
            {hasMore && (
              <Group justify="center" mt="md">
                <Button
                  size="xs"
                  variant="default"
                  loading={loadingMore}
                  onClick={() => fetchCommits(page + 1, true)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5e1da",
                    color: "#1f1c19",
                  }}
                >
                  Tải thêm commits cũ hơn...
                </Button>
              </Group>
            )}
          </Stack>
        ) : (
          <Box ta="center" mt={60} px="md">
            <IconGitCommit
              size={38}
              color="#94a3b8"
              style={{ margin: "0 auto 10px" }}
            />
            <Text fz="sm" fw={500} c="#1f1c19">
              Không tìm thấy commit nào
            </Text>
            <Text fz="xs" c="#6e675f" mt={4}>
              {searchQuery
                ? `Không có commit nào khớp với từ khóa "${searchQuery}".`
                : "Chưa có commit nào trên repository này."}
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
          branch={branchFilter === "all" ? currentBranch : branchFilter}
        />
      )}
    </Box>
  );
}
