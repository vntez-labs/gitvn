"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconGitCompare,
  IconGitMerge,
  IconGitPullRequest,
  IconX,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { CompareDiffModal } from "./CompareDiffModal";
import { CreatePullModal } from "./pulls/CreatePullModal";
import type { WorkspaceTab } from "./WorkspaceHeader";

interface BranchActionBannerProps {
  onTabChange?: (tab: WorkspaceTab) => void;
}

export function BranchActionBanner({ onTabChange }: BranchActionBannerProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();

  const [baseBranch, setBaseBranch] = useState<string>("main");
  const [compareData, setCompareData] = useState<{
    ahead_by: number;
    behind_by: number;
    status: string;
    compare_url: string;
    headBranch?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Reset dismissed khi đổi branch hoặc đổi repo
  useEffect(() => {
    setDismissed(false);
  }, [selectedRepo?.id, currentBranch]);

  useEffect(() => {
    if (!selectedRepo) return;
    const currentRepo = selectedRepo;

    let isMounted = true;
    setLoading(true);

    async function checkComparison(repo: typeof currentRepo) {
      try {
        const branchRes = await axios.get(
          `/api/github/branches?owner=${repo.owner.login}&repo=${repo.name}`,
        );
        if (!isMounted) return;

        const branchList: string[] = (branchRes.data.branches || []).map(
          (b: any) => b.name,
        );
        const defaultB = (repo as any).default_branch || "main";

        const chosenBase =
          currentBranch.toLowerCase() !== "develop" &&
          branchList.includes("develop")
            ? "develop"
            : defaultB;

        setBaseBranch(chosenBase);

        if (currentBranch.toLowerCase() === chosenBase.toLowerCase()) {
          const nonDefault = branchList.filter(
            (b) => b.toLowerCase() !== chosenBase.toLowerCase(),
          );
          if (nonDefault.length === 0) {
            setCompareData(null);
            return;
          }

          // Kiểm tra nhánh đầu tiên khác base xem có commit mới không
          const compRes = await axios.get(
            `/api/github/compare?owner=${repo.owner.login}&repo=${repo.name}&base=${encodeURIComponent(
              chosenBase,
            )}&head=${encodeURIComponent(nonDefault[0])}`,
          );
          if (!isMounted) return;
          if (compRes.data?.ahead_by > 0) {
            setCompareData({
              ...compRes.data,
              headBranch: nonDefault[0],
            });
          } else {
            setCompareData(null);
          }
          return;
        }

        const compRes = await axios.get(
          `/api/github/compare?owner=${repo.owner.login}&repo=${repo.name}&base=${encodeURIComponent(
            chosenBase,
          )}&head=${encodeURIComponent(currentBranch)}`,
        );
        if (!isMounted) return;
        setCompareData(compRes.data);
      } catch (err) {
        console.error("Lỗi compare branch:", err);
        if (isMounted) setCompareData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkComparison(currentRepo);

    return () => {
      isMounted = false;
    };
  }, [selectedRepo?.id, currentBranch]);

  if (!selectedRepo || dismissed) return null;

  const targetBranch = compareData?.headBranch || currentBranch;
  const aheadCount = compareData?.ahead_by ?? 0;
  const behindCount = compareData?.behind_by ?? 0;
  const compareUrl =
    compareData?.compare_url ||
    `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/compare/${baseBranch}...${targetBranch}?expand=1`;

  if (aheadCount > 0) {
    return (
      <Box
        px="lg"
        py={10}
        style={{
          backgroundColor: "#f0fdf4",
          borderBottom: "1px solid #bbf7d0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 260 }}>
          <Box
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconGitPullRequest size={16} color="#ffffff" />
          </Box>

          <Box>
            <Group gap="xs" wrap="wrap">
              <Text fz={13} fw={600} c="#14532d">
                Nhánh{" "}
                <span style={{ color: "#16a34a", fontFamily: "monospace" }}>
                  {targetBranch}
                </span>{" "}
                có{" "}
                <span style={{ color: "#15803d", fontWeight: 700 }}>
                  {aheadCount} commit mới
                </span>{" "}
                cần merge vào{" "}
                <span style={{ color: "#16a34a", fontFamily: "monospace" }}>
                  {baseBranch}
                </span>
              </Text>
              <Badge size="xs" color="green" variant="filled">
                Sẵn sàng tạo PR
              </Badge>
            </Group>
            <Text fz={11} c="#166534">
              Các thay đổi trên nhánh này chưa được đưa vào nhánh chính. Hãy tạo
              Pull Request để review và merge.
            </Text>
          </Box>
        </Group>

        <Group gap="xs" wrap="nowrap">
          {behindCount > 0 && (
            <Tooltip
              label={`Nhánh của bạn đang thiếu ${behindCount} commit từ ${baseBranch}`}
              withArrow
            >
              <Badge size="sm" color="yellow" variant="light">
                Chậm {behindCount} commit so với {baseBranch}
              </Badge>
            </Tooltip>
          )}

          <Button
            size="xs"
            variant="default"
            leftSection={<IconGitCompare size={14} />}
            onClick={() => setCompareModalOpen(true)}
          >
            Xem Diff ({aheadCount})
          </Button>

          <Button
            size="xs"
            variant="filled"
            onClick={() => setCreateModalOpen(true)}
            leftSection={<IconGitPullRequest size={14} />}
            styles={{
              root: {
                backgroundColor: "#16a34a",
                color: "#ffffff",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#15803d" },
              },
            }}
          >
            Tạo Pull Request
          </Button>

          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={() => setDismissed(true)}
            aria-label="Đóng thông báo"
          >
            <IconX size={14} />
          </ActionIcon>
        </Group>

        <CreatePullModal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          defaultBase={baseBranch}
          defaultHead={targetBranch}
          onSuccess={() => {
            if (onTabChange) onTabChange("pulls");
          }}
        />

        <CompareDiffModal
          opened={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          owner={selectedRepo.owner.login}
          repo={selectedRepo.name}
          baseBranch={baseBranch}
          headBranch={targetBranch}
        />
      </Box>
    );
  }

  return null;
}
