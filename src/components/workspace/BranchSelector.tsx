"use client";

import { Button, Loader, Menu } from "@mantine/core";
import { IconChevronDown, IconGitBranch } from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";

export function BranchSelector() {
  const { selectedRepo, currentBranch, changeBranch } = useDashboardStore();
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  if (!selectedRepo) return null;
  const defaultBranch = (selectedRepo as any)?.default_branch || "main";

  const handleOpen = async () => {
    if (branches.length > 0) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`,
      );
      setBranches(data.branches || []);
    } catch (err) {
      console.error("Lỗi lấy branches:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu shadow="md" width={220} onOpen={handleOpen}>
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
        <Menu.Label c="#71717a" fz={12}>
          Select Branch ({branches.length || 1})
        </Menu.Label>
        {branches.length > 0 ? (
          branches.map((b) => (
            <Menu.Item
              key={b.name}
              leftSection={<IconGitBranch size={14} />}
              onClick={() => changeBranch(b.name)}
              c={currentBranch === b.name ? "#4f46e5" : "#18181b"}
              style={{
                fontSize: 13,
                fontFamily: "monospace",
                fontWeight: currentBranch === b.name ? 600 : 400,
                backgroundColor:
                  currentBranch === b.name
                    ? "rgba(238, 242, 255, 0.7)"
                    : "transparent",
              }}
            >
              {b.name} {b.name === defaultBranch && "(default)"}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item
            c="#4f46e5"
            style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}
          >
            {defaultBranch} (default)
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
