"use client";

import {
  Alert,
  Button,
  Loader,
  Menu,
  Modal,
  Stack,
  TextInput,
} from "@mantine/core";
import { IconChevronDown, IconGitBranch } from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";
import { useRepoBranches } from "@/hooks/useRepoBranches";
import { useDashboardStore } from "@/store/dashboard.store";

export function BranchSelector() {
  const selectedRepo = useDashboardStore((state) => state.selectedRepo);
  const currentBranch = useDashboardStore((state) => state.currentBranch);
  const changeBranch = useDashboardStore((state) => state.changeBranch);
  const [opened, setOpened] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [createError, setCreateError] = useState("");
  const [source, setSource] = useState("");
  const {
    data: branches = [],
    isLoading: loading,
    error,
    mutate,
  } = useRepoBranches(selectedRepo, opened);

  if (!selectedRepo) return null;
  const defaultBranch = selectedRepo.default_branch || "main";

  async function createBranch() {
    if (!selectedRepo || !name.trim()) return;
    setPending(true);
    setCreateError("");
    try {
      const { data } = await axios.post("/api/github/branches", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        name: name.trim(),
        from: source,
      });
      setCreating(false);
      void mutate();
      if (useDashboardStore.getState().selectedRepo?.id === selectedRepo.id)
        await changeBranch(data.name);
    } catch (error) {
      setCreateError(
        axios.isAxiosError(error)
          ? error.response?.data?.error || error.message
          : "Không thể tạo nhánh.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Modal
        opened={creating}
        onClose={() => {
          if (!pending) setCreating(false);
        }}
        title={`Tạo nhánh từ ${source}`}
        closeOnClickOutside={!pending}
        closeOnEscape={!pending}
      >
        <Stack>
          {createError && <Alert color="red">{createError}</Alert>}
          <TextInput
            label="Tên nhánh"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            disabled={pending}
          />
          <Button
            loading={pending}
            disabled={!name.trim()}
            onClick={() => void createBranch()}
          >
            Tạo và chuyển nhánh
          </Button>
        </Stack>
      </Modal>
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
                fontSize: 14,
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
          <Menu.Item
            onClick={() => {
              setName("");
              setCreateError("");
              setSource(currentBranch);
              setCreating(true);
            }}
          >
            Tạo nhánh từ nhánh hiện tại
          </Menu.Item>
          <Menu.Item onClick={() => void mutate()}>Làm mới danh sách</Menu.Item>
          <TextInput
            mx="xs"
            my={4}
            size="xs"
            aria-label="Tìm nhánh"
            placeholder="Tìm nhánh"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {error && <Menu.Label>Không tải được danh sách nhánh</Menu.Label>}
          <Menu.Label c="#71717a" fz={12}>
            Select Branch ({branches.length || 1})
          </Menu.Label>
          {branches.length > 0 ? (
            branches
              .filter((branch) =>
                branch.name.toLowerCase().includes(query.trim().toLowerCase()),
              )
              .map((b) => (
                <Menu.Item
                  key={b.name}
                  leftSection={<IconGitBranch size={14} />}
                  onClick={() => changeBranch(b.name)}
                  c={currentBranch === b.name ? "#dc2626" : "#18181b"}
                  style={{
                    fontSize: 13,
                    fontWeight: currentBranch === b.name ? 600 : 400,
                    backgroundColor:
                      currentBranch === b.name ? "#fef2f2" : "transparent",
                  }}
                >
                  {b.name} {b.name === defaultBranch && "(default)"}
                </Menu.Item>
              ))
          ) : (
            <Menu.Item c="#dc2626" style={{ fontSize: 14, fontWeight: 600 }}>
              {defaultBranch} (default)
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
