"use client";

import { Button, Loader, Menu } from "@mantine/core";
import { IconChevronDown, IconGitBranch } from "@tabler/icons-react";
import { useState } from "react";
import { useRepoBranches } from "@/hooks/useRepoBranches";
import { useDashboardStore } from "@/store/dashboard.store";

export function BranchSelector() {
  const { selectedRepo, currentBranch, changeBranch } = useDashboardStore();
  const [opened, setOpened] = useState(false);
  const {
    data: branches = [],
    isLoading: loading,
    error,
  } = useRepoBranches(selectedRepo, opened);

  if (!selectedRepo) return null;
  const defaultBranch = selectedRepo.default_branch || "main";

  return (
    <Menu shadow="md" width={220} opened={opened} onChange={setOpened}>
      <Menu.Target>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<IconGitBranch size={14} color="#71717a" />}
          rightSection={
            loading ? (
              <Loader size={12} color="gray" />
            ) : (
              <IconChevronDown size={13} color="#71717a" />
            )
          }
          styles={{
            root: {
              backgroundColor: "#ffffff",
              borderColor: "#e4e4e7",
              color: "#18181b",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
              borderRadius: 6,
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: 500,
            },
          }}
        >
          {currentBranch}
        </Button>
      </Menu.Target>

      <Menu.Dropdown
        bg="#ffffff"
        style={{ borderColor: "#e4e4e7", maxHeight: 300, overflowY: "auto" }}
      >
        {error && <Menu.Label>Không tải được danh sách nhánh</Menu.Label>}
        <Menu.Label c="#71717a" fz={12}>
          Select Branch ({branches.length || 1})
        </Menu.Label>
        {branches.length > 0 ? (
          branches.map((b) => (
            <Menu.Item
              key={b.name}
              leftSection={<IconGitBranch size={14} />}
              onClick={() => changeBranch(b.name)}
              c={currentBranch === b.name ? "#dc2626" : "#18181b"}
              style={{
                fontSize: 13,
                fontFamily: "monospace",
                fontWeight: currentBranch === b.name ? 600 : 400,
                backgroundColor:
                  currentBranch === b.name ? "#fef2f2" : "transparent",
              }}
            >
              {b.name} {b.name === defaultBranch && "(default)"}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item
            c="#dc2626"
            style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}
          >
            {defaultBranch} (default)
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
