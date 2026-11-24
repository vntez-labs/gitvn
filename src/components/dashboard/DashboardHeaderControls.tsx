"use client";

import {
  Avatar,
  Button,
  Combobox,
  Group,
  Menu,
  Modal,
  Text,
  TextInput,
  useCombobox,
} from "@mantine/core";
import { useDisclosure, useHotkeys, useOs } from "@mantine/hooks";
import {
  IconCheck,
  IconChevronDown,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { RepoLangIcon } from "./Sidebar/RepoLangIcon";

export function OrganizationPicker() {
  const user = useAuthStore((state) => state.user);
  const orgs = useDashboardStore((state) => state.orgs);
  const selectedOrg = useDashboardStore((state) => state.selectedOrg);
  const selectOrg = useDashboardStore((state) => state.selectOrg);
  const organizations = orgs.filter(
    (org) =>
      !org.isUser && org.login.toLowerCase() !== user?.login.toLowerCase(),
  );
  const active = organizations.find((org) => org.login === selectedOrg);

  function choose(org: string | null) {
    if (org !== selectedOrg) selectOrg(org);
  }

  return (
    <Menu position="bottom-start" width={260} shadow="md" withinPortal>
      <Menu.Target>
        <Button
          className="dashboard-org-trigger"
          variant="subtle"
          color="dark"
          size="sm"
          aria-label={`Đổi tổ chức, hiện tại: ${selectedOrg ?? "Cá nhân"}`}
          leftSection={
            <Avatar
              src={active?.avatar_url ?? user?.avatar_url}
              size={21}
              radius="sm"
            />
          }
          rightSection={<IconChevronDown size={14} />}
        >
          <Text component="span" truncate size="sm" fw={600}>
            {selectedOrg ?? "Cá nhân"}
          </Text>
        </Button>
      </Menu.Target>
      <Menu.Dropdown mah={400} style={{ overflowY: "auto" }}>
        <Menu.Label>Không gian làm việc</Menu.Label>
        <Menu.Item
          onClick={() => choose(null)}
          leftSection={<Avatar src={user?.avatar_url} size={24} radius="xl" />}
          rightSection={selectedOrg === null && <IconCheck size={16} />}
        >
          Cá nhân
        </Menu.Item>
        {organizations.map((org) => (
          <Menu.Item
            key={org.id}
            onClick={() => choose(org.login)}
            leftSection={<Avatar src={org.avatar_url} size={24} radius="sm" />}
            rightSection={selectedOrg === org.login && <IconCheck size={16} />}
          >
            <Text size="sm" truncate>
              {org.login}
            </Text>
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item
          component="a"
          href="/api/integrations/github?reconnect=true"
          leftSection={<IconRefresh size={15} />}
        >
          Cập nhật quyền GitHub
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export function RepositorySearch() {
  const [opened, { open, close }] = useDisclosure(false);
  const [query, setQuery] = useState("");
  const os = useOs();
  const repos = useDashboardStore((state) => state.repos);
  const loading = useDashboardStore((state) => state.dataLoading);
  const combobox = useCombobox({
    opened,
    onDropdownClose: close,
  });
  const term = query.trim().toLowerCase();
  const results = (
    term
      ? repos.filter((repo) => repo.full_name.toLowerCase().includes(term))
      : repos
  ).slice(0, 12);
  const beginSearch = () => {
    combobox.resetSelectedOption();
    setQuery("");
    open();
  };
  useHotkeys([["mod+K", beginSearch]]);

  function openRepo(id: string) {
    const repo = results.find((entry) => String(entry.id) === id);
    if (!repo) return;
    const { orgs, selectedOrg, selectOrg, selectRepo } =
      useDashboardStore.getState();
    const org = orgs.find(
      (entry) =>
        !entry.isUser &&
        entry.login.toLowerCase() === repo.owner.login.toLowerCase(),
    );
    const scope = org?.login ?? null;
    if (scope !== selectedOrg) selectOrg(scope);
    void selectRepo(repo);
    close();
  }

  return (
    <>
      <Button
        className="dashboard-search-trigger"
        size="sm"
        variant="default"
        aria-label="Tìm repository"
        onClick={beginSearch}
        leftSection={<IconSearch size={17} />}
        rightSection={<kbd>{os === "macos" ? "⌘ K" : "Ctrl K"}</kbd>}
      >
        Tìm repository
      </Button>
      <Modal opened={opened} onClose={close} title="Tìm repository" size="lg">
        <Combobox store={combobox} onOptionSubmit={openRepo}>
          <Combobox.EventsTarget>
            <TextInput
              data-autofocus
              aria-label="Tên repository hoặc owner/repo"
              placeholder="Nhập tên hoặc owner/repo"
              leftSection={<IconSearch size={18} />}
              value={query}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  combobox.getSelectedOptionIndex() === -1 &&
                  results[0]
                ) {
                  openRepo(String(results[0].id));
                }
              }}
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                combobox.resetSelectedOption();
              }}
            />
          </Combobox.EventsTarget>
          <Combobox.Options mah={350} style={{ overflowY: "auto" }} mt="xs">
            {results.map((repo) => (
              <Combobox.Option key={repo.id} value={String(repo.id)}>
                <Group gap="sm" wrap="nowrap">
                  <RepoLangIcon repo={repo} />
                  <Text size="sm" truncate>
                    {repo.full_name}
                  </Text>
                </Group>
              </Combobox.Option>
            ))}
            {results.length === 0 && (
              <Combobox.Empty>
                {loading
                  ? "Đang tải repository…"
                  : "Không tìm thấy repository."}
              </Combobox.Empty>
            )}
          </Combobox.Options>
        </Combobox>
      </Modal>
    </>
  );
}
