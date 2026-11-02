'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Group,
  Text,
  Badge,
  Button,
  SegmentedControl,
  TextInput,
  Select,
  Loader,
  ActionIcon,
  Tooltip,
  Switch,
} from '@mantine/core';
import {
  IconLayoutKanban,
  IconListCheck,
  IconPlus,
  IconCalendar,
  IconShieldLock,
  IconSearch,
  IconRefresh,
  IconFileCode,
  IconSparkles,
  IconCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  JiraBoardData,
  JiraSprint,
  JiraTask,
  ProjectPermissions,
  ProjectRole,
  TaskStatus,
} from '@/interfaces/jira';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStore } from '@/store/dashboard.store';
import { KanbanColumn } from './KanbanColumn';
import { BacklogView } from './BacklogView';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { CreateSprintModal } from './CreateSprintModal';
import { PermissionsModal } from './PermissionsModal';
import { TasksJsonModal } from './TasksJsonModal';
import axios from 'axios';

const KANBAN_COLUMNS: { status: TaskStatus; title: string; color: string }[] = [
  { status: 'todo', title: 'To Do', color: '#94a3b8' },
  { status: 'in_progress', title: 'In Progress', color: '#388bfd' },
  { status: 'review', title: 'In Review', color: '#e3b341' },
  { status: 'done', title: 'Done', color: '#2ea043' },
];

export function JiraWorkspace() {
  const { user } = useAuthStore();
  const { selectedRepo } = useDashboardStore();

  const [boardData, setBoardData] = useState<JiraBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncedToGitHub, setSyncedToGitHub] = useState(false);
  const [view, setView] = useState<'kanban' | 'backlog'>('kanban');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  // Modals state
  const [selectedTask, setSelectedTask] = useState<JiraTask | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [quickAddStatus, setQuickAddStatus] = useState<TaskStatus>('todo');
  const [targetSprintId, setTargetSprintId] = useState<string | null>(null);

  const fetchBoardData = () => {
    if (!selectedRepo) return;
    setLoading(true);

    axios
      .get(`/api/jira?owner=${selectedRepo.owner.login}&repo=${selectedRepo.name}`)
      .then((res) => {
        setBoardData(res.data.data);
        setSyncedToGitHub(Boolean(res.data.syncedToGitHub));
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu Jira/Tasks:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBoardData();
  }, [selectedRepo?.id]);

  // Lưu dữ liệu vào file .gitvn/tasks.json và commit lên GitHub
  const persistBoard = async (updatedData: JiraBoardData, customCommitMessage?: string) => {
    if (!selectedRepo) return;
    setBoardData(updatedData);
    setSyncing(true);

    try {
      const res = await axios.post('/api/jira', {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        data: updatedData,
        commitMessage: customCommitMessage,
        forceGitHubSync: true,
      });

      const isSynced = Boolean(res.data?.syncedToGitHub);
      setSyncedToGitHub(isSynced);

      if (isSynced) {
        notifications.show({
          title: 'Đã lưu & đồng bộ GitHub',
          message: 'Thay đổi đã được commit vào .gitvn/tasks.json trên GitHub',
          color: 'green',
        });
      }
    } catch (err) {
      console.error('Lỗi lưu .gitvn/tasks.json:', err);
      notifications.show({
        title: 'Lưu cục bộ',
        message: 'Đã lưu cục bộ vào .gitvn/tasks.json (chưa sync được lên GitHub)',
        color: 'yellow',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Tính toán quyền của user hiện tại
  const currentUsername = user?.login || 'anonymous';
  const repoOwner = selectedRepo?.owner.login || '';
  const isOwner = currentUsername.toLowerCase() === repoOwner.toLowerCase();

  const userRole: ProjectRole = useMemo(() => {
    if (!boardData) return 'viewer';
    if (isOwner) return 'admin';
    return (
      boardData.permissions?.userRoles?.[currentUsername] ||
      boardData.permissions?.defaultRole ||
      'member'
    );
  }, [boardData, currentUsername, isOwner]);

  const isAdminOrPM = userRole === 'admin' || userRole === 'pm';
  const canManageSprint =
    isAdminOrPM || (boardData?.permissions?.canManageSprint?.includes(userRole) ?? false);
  const canCreateBacklog =
    isAdminOrPM || (boardData?.permissions?.canCreateBacklog?.includes(userRole) ?? false);
  const canEdit = userRole !== 'viewer';

  // Sprint hiện hành
  const activeSprint = useMemo(() => {
    if (!boardData || !boardData.sprints?.length) return null;
    return boardData.sprints.find((s) => s.status === 'active') || boardData.sprints[0] || null;
  }, [boardData]);

  // Sprint hiển thị cho Kanban
  const currentSprintForKanban = useMemo(() => {
    if (!boardData || !boardData.sprints?.length) return null;
    if (selectedSprintId === 'active') return activeSprint;
    return boardData.sprints.find((s) => s.id === selectedSprintId) || activeSprint;
  }, [boardData, selectedSprintId, activeSprint]);

  // Lọc task cho Kanban
  const kanbanTasks = useMemo(() => {
    if (!boardData || !boardData.tasks) return [];
    let list = boardData.tasks;

    if (currentSprintForKanban) {
      list = list.filter((t) => t.sprintId === currentSprintForKanban.id);
    }

    if (onlyMyTasks && currentUsername) {
      list = list.filter((t) => t.assignee?.login?.toLowerCase() === currentUsername.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.assignee?.name?.toLowerCase().includes(q) ||
          t.assignee?.login?.toLowerCase().includes(q)
      );
    }

    if (filterPriority) {
      list = list.filter((t) => t.priority === filterPriority);
    }

    return list;
  }, [boardData, currentSprintForKanban, searchQuery, filterPriority, onlyMyTasks, currentUsername]);

  const totalSprintStoryPoints = useMemo(() => {
    return kanbanTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  }, [kanbanTasks]);

  // Drag & drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    if (!boardData || !canEdit) return;

    const updatedTasks = boardData.tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          status: targetStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    persistBoard({
      ...boardData,
      tasks: updatedTasks,
    });
  };

  // Actions Task
  const handleCreateTask = (newTask: JiraTask) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      taskSeq: (boardData.taskSeq || 0) + 1,
      tasks: [newTask, ...boardData.tasks],
    };
    persistBoard(updated);
  };

  const handleUpdateTask = (updatedTask: JiraTask) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      tasks: boardData.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    };
    persistBoard(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      tasks: boardData.tasks.filter((t) => t.id !== taskId),
    };
    persistBoard(updated);
  };

  // Actions Sprint
  const handleCreateSprint = (newSprint: JiraSprint) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      sprints: [...boardData.sprints, newSprint],
    };
    persistBoard(updated);
  };

  const handleStartSprint = (sprintId: string) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      sprints: boardData.sprints.map((s) => ({
        ...s,
        status: (s.id === sprintId ? 'active' : s.status === 'active' ? 'completed' : s.status) as any,
      })),
    };
    persistBoard(updated);
  };

  const handleCompleteSprint = (sprintId: string) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      sprints: boardData.sprints.map((s) =>
        s.id === sprintId ? { ...s, status: 'completed' as const } : s
      ),
    };
    persistBoard(updated);
  };

  const handleDeleteSprint = (sprintId: string) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      sprints: boardData.sprints.filter((s) => s.id !== sprintId),
      tasks: boardData.tasks.map((t) => (t.sprintId === sprintId ? { ...t, sprintId: null } : t)),
    };
    persistBoard(updated);
  };

  const handleMoveTaskToSprint = (taskId: string, sprintId: string | null) => {
    if (!boardData) return;
    const updated = {
      ...boardData,
      tasks: boardData.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              sprintId,
              status: sprintId === null ? ('backlog' as const) : t.status === 'backlog' ? 'todo' : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    };
    persistBoard(updated);
  };

  const handleSavePermissions = (updatedPermissions: ProjectPermissions) => {
    if (!boardData) return;
    persistBoard({
      ...boardData,
      permissions: updatedPermissions,
    });
  };

  if (!selectedRepo) return null;

  const repoPrefix = selectedRepo.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'TASK';

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        backgroundColor: '#090d16',
        color: '#f0f6fc',
      }}
    >
      {/* Top Header Bar */}
      <Box
        px="lg"
        py={10}
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0d1117',
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {/* Left: View Switcher & Sprint Selector */}
          <Group gap="sm" wrap="wrap">
            <SegmentedControl
              value={view}
              onChange={(val) => setView(val as 'kanban' | 'backlog')}
              size="xs"
              data={[
                {
                  value: 'kanban',
                  label: (
                    <Group gap={6}>
                      <IconLayoutKanban size={14} color={view === 'kanban' ? '#58a6ff' : '#8b949e'} />
                      <span style={{ fontWeight: 600 }}>Bảng Kanban</span>
                    </Group>
                  ),
                },
                {
                  value: 'backlog',
                  label: (
                    <Group gap={6}>
                      <IconListCheck size={14} color={view === 'backlog' ? '#58a6ff' : '#8b949e'} />
                      <span style={{ fontWeight: 600 }}>Backlog & Sprints</span>
                    </Group>
                  ),
                },
              ]}
              styles={{
                root: {
                  backgroundColor: '#161b22',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: 3,
                  borderRadius: 8,
                },
                indicator: {
                  backgroundColor: '#21262d',
                  borderRadius: 6,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                },
                label: {
                  color: '#c9d1d9',
                  fontSize: 12,
                  padding: '4px 10px',
                },
              }}
            />

            {view === 'kanban' && boardData && boardData.sprints?.length > 0 && (
              <Select
                size="xs"
                value={selectedSprintId}
                onChange={(val) => setSelectedSprintId(val || 'active')}
                leftSection={<IconCalendar size={13} color="#8b949e" />}
                data={[
                  {
                    value: 'active',
                    label: activeSprint ? `Đang chạy: ${activeSprint.name}` : 'Sprint hiện tại',
                  },
                  ...boardData.sprints.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${s.status.toUpperCase()})`,
                  })),
                ]}
                styles={{
                  input: {
                    backgroundColor: '#161b22',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#f0f6fc',
                    fontWeight: 600,
                    width: 230,
                    borderRadius: 8,
                  },
                  dropdown: {
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                  },
                }}
              />
            )}
          </Group>

          {/* Right Toolbar: Tasks.json File, Role, and Action Buttons */}
          <Group gap="xs" wrap="nowrap">
            {/* .gitvn/tasks.json Editor Button */}
            <Tooltip label="Xem, chỉnh sửa và đồng bộ trực tiếp file .gitvn/tasks.json" withArrow>
              <Button
                size="xs"
                variant="default"
                leftSection={<IconFileCode size={14} color="#58a6ff" />}
                onClick={() => setJsonModalOpen(true)}
                styles={{
                  root: {
                    backgroundColor: '#161b22',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#e6edf3',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    '&:hover': {
                      backgroundColor: '#21262d',
                      borderColor: '#58a6ff',
                    },
                  },
                }}
              >
                <Group gap={6}>
                  <span>.gitvn/tasks.json</span>
                  <Box
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: syncedToGitHub ? '#2ea043' : '#388bfd',
                    }}
                  />
                </Group>
              </Button>
            </Tooltip>

            {/* Role Badge with Click to Manage Permissions */}
            <Tooltip label="Nhấn để quản lý vai trò thành viên & phân quyền" withArrow>
              <Badge
                size="md"
                variant="light"
                styles={{
                  root: {
                    backgroundColor: 'rgba(56, 139, 253, 0.1)',
                    border: '1px solid rgba(56, 139, 253, 0.25)',
                    color: '#79c0ff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: 11,
                    height: 28,
                    borderRadius: 6,
                    padding: '0 8px',
                  },
                }}
                leftSection={<IconShieldLock size={13} />}
                onClick={() => setPermissionsOpen(true)}
              >
                {userRole}
              </Badge>
            </Tooltip>

            {/* Button Tạo Sprint */}
            {canManageSprint && (
              <Button
                size="xs"
                variant="default"
                leftSection={<IconPlus size={14} />}
                onClick={() => setCreateSprintOpen(true)}
                styles={{
                  root: {
                    backgroundColor: '#161b22',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#c9d1d9',
                    fontWeight: 500,
                    borderRadius: 8,
                    '&:hover': {
                      backgroundColor: '#21262d',
                      color: '#ffffff',
                    },
                  },
                }}
              >
                Tạo Sprint
              </Button>
            )}

            {/* Button Tạo Task (Linear / GitHub Style) */}
            {canEdit && (
              <Button
                size="xs"
                variant="filled"
                leftSection={<IconPlus size={14} />}
                onClick={() => {
                  setTargetSprintId(currentSprintForKanban?.id || null);
                  setQuickAddStatus('todo');
                  setCreateTaskOpen(true);
                }}
                styles={{
                  root: {
                    backgroundColor: '#238636',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      backgroundColor: '#2ea043',
                    },
                  },
                }}
              >
                Tạo công việc
              </Button>
            )}

            {/* Refresh / Sync Button */}
            <Tooltip label={syncing ? 'Đang lưu...' : 'Làm mới bảng từ file'} withArrow>
              <ActionIcon
                size="md"
                variant="default"
                loading={syncing}
                onClick={fetchBoardData}
                styles={{
                  root: {
                    backgroundColor: '#161b22',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    '&:hover': { backgroundColor: '#21262d' },
                  },
                }}
              >
                <IconRefresh size={14} color="#8b949e" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Box>

      {/* Loading state */}
      {loading ? (
        <Box ta="center" py={100} style={{ flex: 1 }}>
          <Loader size="md" color="blue" />
          <Text fz={13} c="#8b949e" mt="md">
            Đang tải dữ liệu từ <code style={{ color: '#58a6ff' }}>.gitvn/tasks.json</code>...
          </Text>
        </Box>
      ) : !boardData ? (
        <Box ta="center" py={100} style={{ flex: 1 }}>
          <Text fz={14} c="#8b949e" mb="md">
            Không tìm thấy file cấu hình công việc.
          </Text>
          <Button
            size="xs"
            variant="filled"
            onClick={fetchBoardData}
            leftSection={<IconRefresh size={14} />}
          >
            Thử tải lại
          </Button>
        </Box>
      ) : view === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          {/* Filter Sub-bar */}
          <Group
            px="lg"
            py={8}
            justify="space-between"
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: '#161b22',
              flexShrink: 0,
            }}
          >
            <Group gap="xs">
              <TextInput
                size="xs"
                placeholder={`Tìm kiếm (${repoPrefix}-1, tiêu đề, người nhận)...`}
                leftSection={<IconSearch size={13} color="#6e7681" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                styles={{
                  input: {
                    backgroundColor: '#0d1117',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#f0f6fc',
                    width: 290,
                    borderRadius: 6,
                  },
                }}
              />

              <Select
                size="xs"
                placeholder="Độ ưu tiên"
                clearable
                value={filterPriority}
                onChange={setFilterPriority}
                data={[
                  { value: 'urgent', label: '🔴 Urgent' },
                  { value: 'high', label: '🟠 High' },
                  { value: 'medium', label: '🔵 Medium' },
                  { value: 'low', label: '⚪ Low' },
                ]}
                styles={{
                  input: {
                    backgroundColor: '#0d1117',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: '#f0f6fc',
                    width: 130,
                    borderRadius: 6,
                  },
                  dropdown: {
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                  },
                }}
              />

              <Switch
                size="xs"
                label="Việc của tôi"
                checked={onlyMyTasks}
                onChange={(e) => setOnlyMyTasks(e.currentTarget.checked)}
                styles={{
                  label: {
                    color: '#c9d1d9',
                    fontSize: 12,
                    fontWeight: 500,
                  },
                }}
              />
            </Group>

            {currentSprintForKanban && (
              <Group gap="xs">
                <Text fz={12} c="#8b949e">
                  Sprint: <span style={{ color: '#58a6ff', fontWeight: 600 }}>{currentSprintForKanban.name}</span>
                </Text>
                <Badge
                  size="xs"
                  variant="outline"
                  styles={{
                    root: {
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#8b949e',
                      fontWeight: 600,
                    },
                  }}
                >
                  {kanbanTasks.length} việc • {totalSprintStoryPoints} SP
                </Badge>
              </Group>
            )}
          </Group>

          {/* Kanban Columns Canvas */}
          <Box
            className="hide-scrollbar"
            p="md"
            style={{
              flex: 1,
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              overflowY: 'hidden',
              minHeight: 0,
              backgroundColor: '#090d16',
            }}
          >
            {KANBAN_COLUMNS.map((col) => {
              const colTasks = kanbanTasks.filter((t) => t.status === col.status);

              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  color={col.color}
                  tasks={colTasks}
                  onDropTask={handleDropTask}
                  onCardClick={(task) => {
                    setSelectedTask(task);
                    setTaskDetailOpen(true);
                  }}
                  onDragStart={handleDragStart}
                  onQuickAdd={(st) => {
                    setTargetSprintId(currentSprintForKanban?.id || null);
                    setQuickAddStatus(st);
                    setCreateTaskOpen(true);
                  }}
                  canEdit={canEdit}
                />
              );
            })}
          </Box>
        </Box>
      ) : (
        /* BACKLOG & SPRINTS VIEW */
        <BacklogView
          sprints={boardData.sprints || []}
          tasks={boardData.tasks || []}
          canManageSprint={canManageSprint}
          canCreateBacklog={canCreateBacklog}
          onOpenCreateTask={(sprintId) => {
            setTargetSprintId(sprintId);
            setQuickAddStatus(sprintId ? 'todo' : 'backlog');
            setCreateTaskOpen(true);
          }}
          onOpenCreateSprint={() => setCreateSprintOpen(true)}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setTaskDetailOpen(true);
          }}
          onMoveTaskToSprint={handleMoveTaskToSprint}
          onStartSprint={handleStartSprint}
          onCompleteSprint={handleCompleteSprint}
          onDeleteSprint={handleDeleteSprint}
        />
      )}

      {/* Modals */}
      {boardData && (
        <TaskDetailModal
          opened={taskDetailOpen}
          onClose={() => setTaskDetailOpen(false)}
          task={selectedTask}
          sprints={boardData.sprints || []}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          canEdit={canEdit}
        />
      )}

      {boardData && (
        <CreateTaskModal
          opened={createTaskOpen}
          onClose={() => setCreateTaskOpen(false)}
          sprints={boardData.sprints || []}
          defaultSprintId={targetSprintId}
          defaultStatus={quickAddStatus}
          nextSeq={(boardData.taskSeq || 0) + 1}
          repoPrefix={repoPrefix}
          onCreateTask={handleCreateTask}
        />
      )}

      {boardData && (
        <CreateSprintModal
          opened={createSprintOpen}
          onClose={() => setCreateSprintOpen(false)}
          nextSprintNumber={(boardData.sprints?.length || 0) + 1}
          onCreateSprint={handleCreateSprint}
        />
      )}

      {boardData && (
        <PermissionsModal
          opened={permissionsOpen}
          onClose={() => setPermissionsOpen(false)}
          permissions={boardData.permissions}
          currentUsername={currentUsername}
          isAdminOrPM={isAdminOrPM}
          onSavePermissions={handleSavePermissions}
        />
      )}

      {/* .gitvn/tasks.json Direct Raw Editor Modal */}
      <TasksJsonModal
        opened={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        boardData={boardData}
        syncedToGitHub={syncedToGitHub}
        onSaveData={persistBoard}
        repoPrefix={repoPrefix}
      />
    </Box>
  );
}
