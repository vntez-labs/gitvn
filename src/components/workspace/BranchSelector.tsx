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
          leftSection={<IconGitBranch size={14} color="#64748b" />}
          rightSection={
            loading ? (
              <Loader size={12} color="gray" />
            ) : (
              <IconChevronDown size={13} color="#64748b" />
            )
          }
          styles={{
            root: {
              backgroundColor: "#f8fafc",
              borderColor: "#e2e8f0",
              color: "#1e293b",
              fontFamily: "monospace",
              fontSize: 13,
              fontWeight: 500,
            },
          }}
        >
          {currentBranch}
        </Button>
      </Menu.Target>

      <Menu.Dropdown
        bg="#ffffff"
        style={{ borderColor: "#e2e8f0", maxHeight: 300, overflowY: "auto" }}
      >
        <Menu.Label c="#64748b" fz={12}>
          Select Branch ({branches.length || 1})
        </Menu.Label>
        {branches.length > 0 ? (
          branches.map((b) => (
            <Menu.Item
              key={b.name}
              leftSection={<IconGitBranch size={14} />}
              onClick={() => changeBranch(b.name)}
              c={currentBranch === b.name ? "#fb291a" : "#1e293b"}
              style={{ fontSize: 13, fontFamily: "monospace" }}
            >
              {b.name} {b.name === defaultBranch && "(default)"}
            </Menu.Item>
          ))
        ) : (
          <Menu.Item
            c="#fb291a"
            style={{ fontSize: 13, fontFamily: "monospace" }}
          >
            {defaultBranch} (default)
          </Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
