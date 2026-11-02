"use client";

import {
  Alert,
  Box,
  Button,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArchive,
  IconCheck,
  IconGitBranch,
  IconLock,
  IconTrash,
  IconWorld,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { DangerZoneModals } from "./settings/DangerZoneModals";
import { useDashboardStore } from "@/store/dashboard.store";

export function SettingsTab() {
  const { selectedRepo, selectRepo, fetchInitialData } = useDashboardStore();

  // 1. General Info State
  const [repoName, setRepoName] = useState(selectedRepo?.name || "");
  const [description, setDescription] = useState(
    selectedRepo?.description || "",
  );
  const [homepage, setHomepage] = useState(
    (selectedRepo as any)?.homepage || "",
  );
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 2. Default Branch State
  const [defaultBranch, setDefaultBranch] = useState(
    (selectedRepo as any)?.default_branch || "main",
  );
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);

  // 3. Features & PR Strategy Toggles
  const [features, setFeatures] = useState({
    has_issues: (selectedRepo as any)?.has_issues ?? true,
    has_wiki: (selectedRepo as any)?.has_wiki ?? true,
    has_projects: (selectedRepo as any)?.has_projects ?? true,
    allow_squash_merge: (selectedRepo as any)?.allow_squash_merge ?? true,
    allow_merge_commit: (selectedRepo as any)?.allow_merge_commit ?? true,
    allow_rebase_merge: (selectedRepo as any)?.allow_rebase_merge ?? true,
    delete_branch_on_merge:
      (selectedRepo as any)?.delete_branch_on_merge ?? false,
  });
  const [savingFeatures, setSavingFeatures] = useState(false);

  // 4. Modals State
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRepo) return;
    setRepoName(selectedRepo.name);
    setDescription(selectedRepo.description || "");
    setHomepage((selectedRepo as any).homepage || "");
    setDefaultBranch((selectedRepo as any).default_branch || "main");

    // Tải danh sách branches
    setLoadingBranches(true);
    axios
      .get(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`,
      )
      .then((res) => {
        const branchNames = (res.data.branches || []).map((b: any) => b.name);
        setAvailableBranches(branchNames);
      })
      .catch((err) => console.error("Lỗi tải branches:", err))
      .finally(() => setLoadingBranches(false));
  }, [selectedRepo?.id]);

  if (!selectedRepo) return null;

  const isPrivate = selectedRepo.private;
  const isArchived = (selectedRepo as any).archived;
  const expectedConfirmText = `${selectedRepo.owner.login}/${selectedRepo.name}`;

  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setGeneralMessage(null);
    try {
      const { data } = await axios.patch("/api/github/repo", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        name:
          repoName.trim() !== selectedRepo.name ? repoName.trim() : undefined,
        description: description.trim(),
        homepage: homepage.trim(),
      });

      setGeneralMessage({
        type: "success",
        text: "Cập nhật thông tin repository thành công!",
      });
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      setGeneralMessage({
        type: "error",
        text: err.response?.data?.error || "Có lỗi xảy ra khi lưu thông tin.",
      });
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveDefaultBranch = async () => {
    setSavingBranch(true);
    try {
      const { data } = await axios.patch("/api/github/repo", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        default_branch: defaultBranch,
      });
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      alert(err.response?.data?.error || "Đổi nhánh mặc định thất bại.");
    } finally {
      setSavingBranch(false);
    }
  };

  const handleToggleFeature = async (
    key: keyof typeof features,
    value: boolean,
  ) => {
    const updated = { ...features, [key]: value };
    setFeatures(updated);
    setSavingFeatures(true);
    try {
      const { data } = await axios.patch("/api/github/repo", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        [key]: value,
      });
      await selectRepo(data.repo);
    } catch (err: any) {
      console.error("Lỗi lưu cài đặt tính năng:", err);
    } finally {
      setSavingFeatures(false);
    }
  };

  const handleChangeVisibility = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const { data } = await axios.patch("/api/github/repo", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        private: !isPrivate,
      });
      setVisibilityModalOpen(false);
      setConfirmInput("");
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Đổi visibility thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveRepo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const { data } = await axios.patch("/api/github/repo", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        archived: true,
      });
      setArchiveModalOpen(false);
      setConfirmInput("");
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Lưu trữ repo thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRepo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axios.delete("/api/github/repo", {
        data: { owner: selectedRepo.owner.login, repo: selectedRepo.name },
      });
      setDeleteModalOpen(false);
      setConfirmInput("");
      await fetchInitialData();
      await selectRepo(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error || "Xóa repo thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 24px",
        minHeight: 0,
        backgroundColor: "#f8fafc",
      }}
    >
      <Box style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* 1. GENERAL SETTINGS */}
        <Box mb="md">
          <Text fz={18} fw={700} c="#0f172a">
            General Settings
          </Text>
          <Text fz="xs" c="#64748b" mt={2}>
            Cấu hình tên, mô tả và website hiển thị của dự án
          </Text>
        </Box>

        {generalMessage && (
          <Alert
            color={generalMessage.type === "success" ? "green" : "red"}
            icon={
              generalMessage.type === "success" ? (
                <IconCheck size={16} />
              ) : (
                <IconAlertTriangle size={16} />
              )
            }
            mb="lg"
            withCloseButton
            onClose={() => setGeneralMessage(null)}
          >
            {generalMessage.text}
          </Alert>
        )}

        <Paper
          p="lg"
          radius="md"
          bg="#ffffff"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          mb="xl"
        >
          <Stack gap="md">
            <TextInput
              label="Repository name"
              value={repoName}
              onChange={(e) => setRepoName(e.currentTarget.value)}
              size="xs"
              styles={{
                label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                  fontFamily: "monospace",
                },
              }}
            />

            <Textarea
              label="Description"
              placeholder="Mô tả ngắn gọn về dự án..."
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              rows={3}
              size="xs"
              styles={{
                label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
              }}
            />

            <TextInput
              label="Website URL"
              placeholder="https://yourproject.com"
              value={homepage}
              onChange={(e) => setHomepage(e.currentTarget.value)}
              size="xs"
              leftSection={<IconWorld size={14} color="#64748b" />}
              styles={{
                label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
              }}
            />

            <Group justify="flex-end" mt="xs">
              <Button
                size="xs"
                color="indigo"
                loading={savingGeneral}
                onClick={handleSaveGeneral}
                style={{ fontWeight: 600 }}
              >
                Lưu thay đổi
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* 2. DEFAULT BRANCH */}
        <Box mb="md">
          <Text fz={18} fw={700} c="#0f172a">
            Default Branch
          </Text>
          <Text fz="xs" c="#64748b" mt={2}>
            Nhánh mặc định cho các thao tác clone, commit và pull request
          </Text>
        </Box>

        <Paper
          p="lg"
          radius="md"
          bg="#ffffff"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          mb="xl"
        >
          <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
            <Box style={{ flex: 1, minWidth: 260 }}>
              <Select
                label="Nhánh mặc định"
                data={availableBranches.map((b) => ({ value: b, label: b }))}
                value={defaultBranch}
                onChange={(val) => setDefaultBranch(val || "main")}
                size="xs"
                leftSection={<IconGitBranch size={14} color="#64748b" />}
                styles={{
                  label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
                  input: {
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                    color: "#0f172a",
                    fontFamily: "monospace",
                  },
                }}
              />
            </Box>

            <Button
              size="xs"
              variant="default"
              loading={savingBranch}
              onClick={handleSaveDefaultBranch}
              disabled={defaultBranch === (selectedRepo as any).default_branch}
            >
              Cập nhật nhánh mặc định
            </Button>
          </Group>
        </Paper>

        {/* 3. FEATURES & MERGE STRATEGY */}
        <Box mb="md">
          <Text fz={18} fw={700} c="#0f172a">
            Features & Pull Requests
          </Text>
          <Text fz="xs" c="#64748b" mt={2}>
            Bật/tắt các tính năng bổ sung và chiến lược hợp nhất PR
          </Text>
        </Box>

        <Paper
          p="lg"
          radius="md"
          bg="#ffffff"
          style={{
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
          mb="xl"
        >
          <Stack gap="lg">
            <Group justify="space-between" align="center">
              <Box>
                <Text fz="sm" fw={600} c="#0f172a">
                  Issues
                </Text>
                <Text fz="xs" c="#64748b">
                  Theo dõi lỗi và yêu cầu công việc
                </Text>
              </Box>
              <Switch
                checked={features.has_issues}
                onChange={(e) =>
                  handleToggleFeature("has_issues", e.currentTarget.checked)
                }
                color="indigo"
              />
            </Group>

            <Divider color="#e2e8f0" />

            <Group justify="space-between" align="center">
              <Box>
                <Text fz="sm" fw={600} c="#0f172a">
                  Allow squash merging
                </Text>
                <Text fz="xs" c="#64748b">
                  Gộp toàn bộ commit của PR thành một commit duy nhất khi merge
                </Text>
              </Box>
              <Switch
                checked={features.allow_squash_merge}
                onChange={(e) =>
                  handleToggleFeature(
                    "allow_squash_merge",
                    e.currentTarget.checked,
                  )
                }
                color="indigo"
              />
            </Group>

            <Divider color="#e2e8f0" />

            <Group justify="space-between" align="center">
              <Box>
                <Text fz="sm" fw={600} c="#0f172a">
                  Automatically delete head branches
                </Text>
                <Text fz="xs" c="#64748b">
                  Tự động xóa nhánh nguồn sau khi PR được merge thành công
                </Text>
              </Box>
              <Switch
                checked={features.delete_branch_on_merge}
                onChange={(e) =>
                  handleToggleFeature(
                    "delete_branch_on_merge",
                    e.currentTarget.checked,
                  )
                }
                color="indigo"
              />
            </Group>
          </Stack>
        </Paper>

        {/* 4. DANGER ZONE */}
        <Box mb="md">
          <Text fz={18} fw={700} c="#dc2626">
            Danger Zone
          </Text>
          <Text fz="xs" c="#64748b" mt={2}>
            Các hành động có rủi ro cao hoặc không thể hoàn tác
          </Text>
        </Box>

        <Paper
          p="lg"
          radius="md"
          bg="#ffffff"
          style={{
            border: "1px solid #fecaca",
            boxShadow: "0 1px 3px rgba(220, 38, 38, 0.05)",
          }}
          mb="xl"
        >
          <Stack gap="lg">
            {/* Change Visibility */}
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Box>
                <Text fz="sm" fw={600} c="#0f172a">
                  Change repository visibility
                </Text>
                <Text fz="xs" c="#64748b">
                  Hiện tại repository đang là{" "}
                  <strong>{isPrivate ? "Private" : "Public"}</strong>.
                </Text>
              </Box>
              <Button
                variant="outline"
                color="red"
                size="xs"
                onClick={() => {
                  setConfirmInput("");
                  setVisibilityModalOpen(true);
                }}
              >
                Change to {isPrivate ? "Public" : "Private"}
              </Button>
            </Group>

            <Divider color="#fee2e2" />

            {/* Archive Repo */}
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Box>
                <Text fz="sm" fw={600} c="#0f172a">
                  {isArchived
                    ? "Unarchive this repository"
                    : "Archive this repository"}
                </Text>
                <Text fz="xs" c="#64748b">
                  Đánh dấu repository ở chế độ chỉ đọc (read-only) và không thể
                  commit.
                </Text>
              </Box>
              <Button
                variant="outline"
                color="red"
                size="xs"
                disabled={isArchived}
                onClick={() => {
                  setConfirmInput("");
                  setArchiveModalOpen(true);
                }}
              >
                {isArchived ? "Archived" : "Archive this repository"}
              </Button>
            </Group>

            <Divider color="#fee2e2" />

            {/* Delete Repo */}
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Box>
                <Text fz="sm" fw={600} c="#dc2626">
                  Delete this repository
                </Text>
                <Text fz="xs" c="#64748b">
                  Xóa vĩnh viễn repository này cùng toàn bộ commits, branches và
                  pull requests.
                </Text>
              </Box>
              <Button
                variant="filled"
                color="red"
                size="xs"
                onClick={() => {
                  setConfirmInput("");
                  setDeleteModalOpen(true);
                }}
              >
                Delete this repository
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Box>

      {/* DANGER ZONE MODALS */}
      <DangerZoneModals
        visibilityModalOpen={visibilityModalOpen}
        onCloseVisibilityModal={() => setVisibilityModalOpen(false)}
        handleChangeVisibility={handleChangeVisibility}
        archiveModalOpen={archiveModalOpen}
        onCloseArchiveModal={() => setArchiveModalOpen(false)}
        handleArchiveRepo={handleArchiveRepo}
        deleteModalOpen={deleteModalOpen}
        onCloseDeleteModal={() => setDeleteModalOpen(false)}
        handleDeleteRepo={handleDeleteRepo}
        expectedConfirmText={expectedConfirmText}
        confirmInput={confirmInput}
        setConfirmInput={setConfirmInput}
        actionLoading={actionLoading}
        actionError={actionError}
        isPrivate={isPrivate}
      />
    </Box>
  );
}
