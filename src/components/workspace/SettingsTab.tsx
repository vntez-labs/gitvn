'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  TextInput,
  Textarea,
  Button,
  Paper,
  Stack,
  Divider,
  Modal,
  Alert,
  Loader,
  Group,
  Switch,
  Select,
} from '@mantine/core';
import {
  IconAlertTriangle,
  IconCheck,
  IconLock,
  IconWorld,
  IconArchive,
  IconTrash,
  IconGitBranch,
} from '@tabler/icons-react';
import { useDashboardStore } from '@/store/dashboard.store';
import axios from 'axios';

export function SettingsTab() {
  const { selectedRepo, selectRepo, fetchInitialData } = useDashboardStore();

  // 1. General Info State
  const [repoName, setRepoName] = useState(selectedRepo?.name || '');
  const [description, setDescription] = useState(selectedRepo?.description || '');
  const [homepage, setHomepage] = useState((selectedRepo as any)?.homepage || '');
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalMessage, setGeneralMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2. Default Branch State
  const [defaultBranch, setDefaultBranch] = useState((selectedRepo as any)?.default_branch || 'main');
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
    delete_branch_on_merge: (selectedRepo as any)?.delete_branch_on_merge ?? false,
  });
  const [savingFeatures, setSavingFeatures] = useState(false);

  // 4. Modals State
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRepo) return;
    setLoadingBranches(true);
    axios
      .get(`/api/github/branches?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`)
      .then((res) => {
        const branchList = (res.data.branches || []).map((b: any) => b.name);
        setAvailableBranches(branchList);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingBranches(false));
  }, [selectedRepo]);

  if (!selectedRepo) return null;

  const repoFullName = `${selectedRepo.owner.login}/${selectedRepo.name}`;
  const isPrivate = selectedRepo.private;
  const isArchived = (selectedRepo as any)?.archived;

  // Cập nhật thông tin chung
  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setGeneralMessage(null);
    try {
      const { data } = await axios.patch('/api/github/repo', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        name: repoName.trim(),
        description: description.trim(),
        homepage: homepage.trim(),
      });
      setGeneralMessage({ type: 'success', text: 'Cập nhật thông tin cơ bản thành công!' });
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      setGeneralMessage({ type: 'error', text: err.response?.data?.error || 'Có lỗi xảy ra khi lưu thông tin.' });
    } finally {
      setSavingGeneral(false);
    }
  };

  // Cập nhật Default Branch
  const handleSaveBranch = async () => {
    setSavingBranch(true);
    try {
      const { data } = await axios.patch('/api/github/repo', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        default_branch: defaultBranch,
      });
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingBranch(false);
    }
  };

  // Cập nhật Features / PR switches
  const handleToggleFeature = async (key: keyof typeof features, value: boolean) => {
    const updated = { ...features, [key]: value };
    setFeatures(updated);
    setSavingFeatures(true);
    try {
      const { data } = await axios.patch('/api/github/repo', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        [key]: value,
      });
      await selectRepo(data.repo);
    } catch (err: any) {
      setFeatures(features); // Rollback nếu lỗi
    } finally {
      setSavingFeatures(false);
    }
  };

  // Visibility, Archive, Delete handlers
  const handleToggleVisibility = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const { data } = await axios.patch('/api/github/repo', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        private: !isPrivate,
      });
      setVisibilityModalOpen(false);
      setConfirmInput('');
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Đổi visibility thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveRepo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const { data } = await axios.patch('/api/github/repo', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        archived: true,
      });
      setArchiveModalOpen(false);
      setConfirmInput('');
      await fetchInitialData();
      await selectRepo(data.repo);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Lưu trữ repo thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRepo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axios.delete('/api/github/repo', {
        data: { owner: selectedRepo.owner.login, repo: selectedRepo.name },
      });
      setDeleteModalOpen(false);
      setConfirmInput('');
      await fetchInitialData();
      await selectRepo(null);
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Xóa repo thất bại.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', minHeight: 0 }}>
      <Box style={{ maxWidth: 840, margin: '0 auto' }}>

        {/* 1. GENERAL SETTINGS */}
        <Box mb="md">
          <Text fz={18} fw={700} c="#f0f6fc">General Settings</Text>
          <Text fz="xs" c="#8b949e" mt={2}>Cấu hình tên, mô tả và website hiển thị của dự án</Text>
        </Box>

        {generalMessage && (
          <Alert
            color={generalMessage.type === 'success' ? 'green' : 'red'}
            icon={generalMessage.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
            mb="lg"
            withCloseButton
            onClose={() => setGeneralMessage(null)}
          >
            {generalMessage.text}
          </Alert>
        )}

        <Paper p="lg" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }} mb="xl">
          <Stack gap="md">
            <TextInput
              label="Repository name"
              value={repoName}
              onChange={(e) => setRepoName(e.currentTarget.value)}
              size="xs"
              styles={{
                label: { color: '#f0f6fc', fontWeight: 600, marginBottom: 6 },
                input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc', fontFamily: 'monospace' },
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
                label: { color: '#f0f6fc', fontWeight: 600, marginBottom: 6 },
                input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc' },
              }}
            />

            <TextInput
              label="Website URL"
              placeholder="https://yourproject.com"
              value={homepage}
              onChange={(e) => setHomepage(e.currentTarget.value)}
              size="xs"
              leftSection={<IconWorld size={14} color="#8b949e" />}
              styles={{
                label: { color: '#f0f6fc', fontWeight: 600, marginBottom: 6 },
                input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc' },
              }}
            />

            <Box mt="xs">
              <Button
                size="xs"
                loading={savingGeneral}
                onClick={handleSaveGeneral}
                styles={{ root: { backgroundColor: '#238636', '&:hover': { backgroundColor: '#2ea043' } } }}
              >
                Save changes
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Divider my="xl" color="#30363d" />

        {/* 2. DEFAULT BRANCH */}
        <Box mb="md">
          <Text fz={18} fw={700} c="#f0f6fc">Default Branch</Text>
          <Text fz="xs" c="#8b949e" mt={2}>Nhánh mặc định dùng khi clone và tạo Pull Request</Text>
        </Box>

        <Paper p="lg" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }} mb="xl">
          <Group justify="space-between" align="flex-end">
            <Box style={{ flex: 1, maxWidth: 360 }}>
              <Select
                label="Switch default branch"
                value={defaultBranch}
                onChange={(val) => setDefaultBranch(val || 'main')}
                data={availableBranches}
                rightSection={loadingBranches ? <Loader size={12} color="gray" /> : null}
                leftSection={<IconGitBranch size={14} color="#8b949e" />}
                size="xs"
                styles={{
                  label: { color: '#f0f6fc', fontWeight: 600, marginBottom: 6 },
                  input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc', fontFamily: 'monospace' },
                }}
              />
            </Box>
            <Button
              size="xs"
              variant="default"
              loading={savingBranch}
              onClick={handleSaveBranch}
              styles={{ root: { borderColor: '#30363d', color: '#f0f6fc', '&:hover': { backgroundColor: '#21262d' } } }}
            >
              Update branch
            </Button>
          </Group>
        </Paper>

        <Divider my="xl" color="#30363d" />

        {/* 3. REPOSITORY FEATURES & PR MERGES */}
        <Box mb="md">
          <Group justify="space-between" align="center">
            <Box>
              <Text fz={18} fw={700} c="#f0f6fc">Features & Pull Requests</Text>
              <Text fz="xs" c="#8b949e" mt={2}>Bật/tắt các công cụ cộng tác và chiến lược merge mã nguồn</Text>
            </Box>
            {savingFeatures && (
              <Group gap={6}>
                <Loader size={12} color="gray" />
                <Text fz={11} c="#8b949e">Đang đồng bộ...</Text>
              </Group>
            )}
          </Group>
        </Box>

        <Paper p="lg" radius="md" bg="#161b22" style={{ border: '1px solid #30363d' }} mb="2rem">
          <Stack gap="md">
            <Group justify="space-between">
              <Box>
                <Text fz="sm" fw={600} c="#f0f6fc">Issues</Text>
                <Text fz="xs" c="#8b949e">Theo dõi lỗi, phản hồi và danh sách việc cần làm</Text>
              </Box>
              <Switch
                checked={features.has_issues}
                onChange={(e) => handleToggleFeature('has_issues', e.currentTarget.checked)}
                color="green"
              />
            </Group>

            <Divider color="#21262d" />

            <Group justify="space-between">
              <Box>
                <Text fz="sm" fw={600} c="#f0f6fc">Wikis</Text>
                <Text fz="xs" c="#8b949e">Tài liệu dự án độc lập nằm ngay cạnh mã nguồn</Text>
              </Box>
              <Switch
                checked={features.has_wiki}
                onChange={(e) => handleToggleFeature('has_wiki', e.currentTarget.checked)}
                color="green"
              />
            </Group>

            <Divider color="#21262d" />

            <Group justify="space-between">
              <Box>
                <Text fz="sm" fw={600} c="#f0f6fc">Allow merge commits</Text>
                <Text fz="xs" c="#8b949e">Tạo merge commit giữ nguyên toàn bộ lịch sử nhánh</Text>
              </Box>
              <Switch
                checked={features.allow_merge_commit}
                onChange={(e) => handleToggleFeature('allow_merge_commit', e.currentTarget.checked)}
                color="green"
              />
            </Group>

            <Divider color="#21262d" />

            <Group justify="space-between">
              <Box>
                <Text fz="sm" fw={600} c="#f0f6fc">Allow squash merging</Text>
                <Text fz="xs" c="#8b949e">Gộp tất cả commits từ nhánh PR thành 1 commit duy nhất</Text>
              </Box>
              <Switch
                checked={features.allow_squash_merge}
                onChange={(e) => handleToggleFeature('allow_squash_merge', e.currentTarget.checked)}
                color="green"
              />
            </Group>

            <Divider color="#21262d" />

            <Group justify="space-between">
              <Box>
                <Text fz="sm" fw={600} c="#f0f6fc">Automatically delete head branches</Text>
                <Text fz="xs" c="#8b949e">Tự động xóa nhánh nguồn sau khi PR được merge</Text>
              </Box>
              <Switch
                checked={features.delete_branch_on_merge}
                onChange={(e) => handleToggleFeature('delete_branch_on_merge', e.currentTarget.checked)}
                color="green"
              />
            </Group>
          </Stack>
        </Paper>

        <Divider my="xl" color="#30363d" />

        {/* 4. DANGER ZONE */}
        <Box mb="sm">
          <Text fz={18} fw={700} c="#f85149">Danger Zone</Text>
          <Text fz="xs" c="#8b949e" mt={2}>Các hành động nhạy cảm có thể ảnh hưởng vĩnh viễn đến repository</Text>
        </Box>

        <Paper radius="md" bg="#0d1117" style={{ border: '1px solid #da3633', overflow: 'hidden' }}>
          <Stack gap={0}>
            {/* Đổi Visibility */}
            <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #21262d' }}>
              <Box>
                <Group gap={6} mb={2}>
                  <IconLock size={15} color="#8b949e" />
                  <Text fz="sm" fw={600} c="#f0f6fc">Change repository visibility</Text>
                </Group>
                <Text fz="xs" c="#8b949e">
                  Hiện tại repository này đang là <span style={{ color: isPrivate ? '#f85149' : '#3fb950', fontWeight: 600 }}>{isPrivate ? 'Private' : 'Public'}</span>.
                </Text>
              </Box>
              <Button
                variant="default"
                color="red"
                size="xs"
                onClick={() => {
                  setConfirmInput('');
                  setActionError(null);
                  setVisibilityModalOpen(true);
                }}
                styles={{ root: { borderColor: '#da3633', color: '#f85149', '&:hover': { backgroundColor: 'rgba(218, 54, 51, 0.1)' } } }}
              >
                Change visibility
              </Button>
            </Group>

            {/* Archive Repository */}
            <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #21262d' }}>
              <Box>
                <Group gap={6} mb={2}>
                  <IconArchive size={15} color="#8b949e" />
                  <Text fz="sm" fw={600} c="#f0f6fc">Archive this repository</Text>
                </Group>
                <Text fz="xs" c="#8b949e">
                  {isArchived ? 'Repository này đã được lưu trữ (chế độ chỉ đọc).' : 'Đưa toàn bộ dự án về chế độ chỉ đọc (Read-only).'}
                </Text>
              </Box>
              <Button
                variant="default"
                color="red"
                size="xs"
                disabled={isArchived}
                onClick={() => {
                  setConfirmInput('');
                  setActionError(null);
                  setArchiveModalOpen(true);
                }}
                styles={{ root: { borderColor: '#da3633', color: '#f85149', '&:hover': { backgroundColor: 'rgba(218, 54, 51, 0.1)' } } }}
              >
                {isArchived ? 'Archived' : 'Archive repository'}
              </Button>
            </Group>

            {/* Delete Repository */}
            <Group justify="space-between" p="md">
              <Box>
                <Group gap={6} mb={2}>
                  <IconTrash size={15} color="#f85149" />
                  <Text fz="sm" fw={600} c="#f85149">Delete this repository</Text>
                </Group>
                <Text fz="xs" c="#8b949e">
                  Sau khi xóa, toàn bộ code, issues, PRs và commits sẽ bị xóa vĩnh viễn khỏi GitHub.
                </Text>
              </Box>
              <Button
                color="red"
                variant="filled"
                size="xs"
                onClick={() => {
                  setConfirmInput('');
                  setActionError(null);
                  setDeleteModalOpen(true);
                }}
                styles={{ root: { backgroundColor: '#da3633', '&:hover': { backgroundColor: '#b62324' } } }}
              >
                Delete repository
              </Button>
            </Group>
          </Stack>
        </Paper>

      </Box>

      {/* MODAL 1: VISIBILITY */}
      <Modal
        opened={visibilityModalOpen}
        onClose={() => setVisibilityModalOpen(false)}
        title={<Text fw={700} c="#f0f6fc">Change repository visibility</Text>}
        centered
        styles={{ content: { backgroundColor: '#161b22', border: '1px solid #30363d' }, header: { backgroundColor: '#161b22' } }}
      >
        <Stack gap="sm">
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Text fz="xs" c="#c9d1d9">
            Bạn đang chuẩn bị chuyển trạng thái của repo sang <b>{isPrivate ? 'Public' : 'Private'}</b>.
          </Text>
          <Text fz="xs" c="#8b949e">
            Gõ đúng <b style={{ color: '#f0f6fc' }}>{repoFullName}</b> để xác nhận:
          </Text>
          <TextInput
            placeholder={repoFullName}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.currentTarget.value)}
            size="xs"
            styles={{ input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc', fontFamily: 'monospace' } }}
          />
          <Button
            fullWidth
            color="red"
            size="xs"
            disabled={confirmInput !== repoFullName}
            loading={actionLoading}
            onClick={handleToggleVisibility}
            mt="xs"
          >
            I understand, change visibility
          </Button>
        </Stack>
      </Modal>

      {/* MODAL 2: ARCHIVE */}
      <Modal
        opened={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        title={<Text fw={700} c="#f0f6fc">Archive repository</Text>}
        centered
        styles={{ content: { backgroundColor: '#161b22', border: '1px solid #30363d' }, header: { backgroundColor: '#161b22' } }}
      >
        <Stack gap="sm">
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Text fz="xs" c="#c9d1d9">
            Sau khi archive, repository sẽ chuyển sang chế độ <b>Read-only</b>.
          </Text>
          <Text fz="xs" c="#8b949e">
            Gõ <b style={{ color: '#f0f6fc' }}>{repoFullName}</b> để xác nhận:
          </Text>
          <TextInput
            placeholder={repoFullName}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.currentTarget.value)}
            size="xs"
            styles={{ input: { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#f0f6fc', fontFamily: 'monospace' } }}
          />
          <Button
            fullWidth
            color="red"
            size="xs"
            disabled={confirmInput !== repoFullName}
            loading={actionLoading}
            onClick={handleArchiveRepo}
            mt="xs"
          >
            I understand, archive repository
          </Button>
        </Stack>
      </Modal>

      {/* MODAL 3: DELETE */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={<Text fw={700} c="#f85149">Delete this repository</Text>}
        centered
        styles={{ content: { backgroundColor: '#161b22', border: '1px solid #da3633' }, header: { backgroundColor: '#161b22' } }}
      >
        <Stack gap="sm">
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Text fz="xs" c="#c9d1d9">
            Hành động này <b>KHÔNG THỂ</b> hoàn tác. Toàn bộ code và lịch sử commit sẽ bị xóa vĩnh viễn.
          </Text>
          <Text fz="xs" c="#8b949e">
            Vui lòng nhập <b style={{ color: '#f85149' }}>{repoFullName}</b> để xác nhận:
          </Text>
          <TextInput
            placeholder={repoFullName}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.currentTarget.value)}
            size="xs"
            styles={{ input: { backgroundColor: '#0d1117', borderColor: '#da3633', color: '#f85149', fontFamily: 'monospace' } }}
          />
          <Button
            fullWidth
            color="red"
            size="xs"
            disabled={confirmInput !== repoFullName}
            loading={actionLoading}
            onClick={handleDeleteRepo}
            styles={{ root: { backgroundColor: '#da3633', '&:hover': { backgroundColor: '#b62324' } } }}
            mt="xs"
          >
            I understand consequences, delete this repository
          </Button>
        </Stack>
      </Modal>

    </Box>
  );
}
