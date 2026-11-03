"use client";

import { Box } from "@mantine/core";
import axios from "axios";
import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";
import { DangerZoneModals } from "./settings/DangerZoneModals";
import { DangerZoneSection } from "./settings/DangerZoneSection";
import { FeaturesSettingsSection } from "./settings/FeaturesSettingsSection";
import { GeneralSettingsSection } from "./settings/GeneralSettingsSection";

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
    axios
      .get(
        `/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`,
      )
      .then((res) => {
        const branchNames = (res.data.branches || []).map((b: any) => b.name);
        setAvailableBranches(branchNames);
      })
      .catch((err) => console.error("Lỗi tải branches:", err));
  }, [selectedRepo]);

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
      await fetchInitialData(true);
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
      await fetchInitialData(true);
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
    try {
      const { data } = await axios.patch("/api/github/repo", {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        [key]: value,
      });
      await selectRepo(data.repo);
    } catch (err: any) {
      console.error("Lỗi lưu cài đặt tính năng:", err);
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
      await fetchInitialData(true);
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
      await fetchInitialData(true);
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
      await fetchInitialData(true);
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
        {/* 1 & 2. General Settings & Default Branch */}
        <GeneralSettingsSection
          repoName={repoName}
          setRepoName={setRepoName}
          description={description}
          setDescription={setDescription}
          homepage={homepage}
          setHomepage={setHomepage}
          savingGeneral={savingGeneral}
          onSaveGeneral={handleSaveGeneral}
          generalMessage={generalMessage}
          onCloseMessage={() => setGeneralMessage(null)}
          defaultBranch={defaultBranch}
          setDefaultBranch={setDefaultBranch}
          availableBranches={availableBranches}
          savingBranch={savingBranch}
          onSaveDefaultBranch={handleSaveDefaultBranch}
          originalDefaultBranch={(selectedRepo as any).default_branch}
        />

        {/* 3. Features & Pull Requests */}
        <FeaturesSettingsSection
          features={features}
          onToggleFeature={handleToggleFeature}
        />

        {/* 4. Danger Zone Actions */}
        <DangerZoneSection
          isPrivate={isPrivate}
          isArchived={isArchived}
          onOpenVisibilityModal={() => {
            setConfirmInput("");
            setVisibilityModalOpen(true);
          }}
          onOpenArchiveModal={() => {
            setConfirmInput("");
            setArchiveModalOpen(true);
          }}
          onOpenDeleteModal={() => {
            setConfirmInput("");
            setDeleteModalOpen(true);
          }}
        />
      </Box>

      {/* Danger Zone Modals */}
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
