'use client';

import {
  Box,
  Group,
  Text,
  Badge,
  Button,
  Stack,
  Paper,
  ActionIcon,
  Tooltip,
  Menu,
  Avatar,
  Progress,
} from '@mantine/core';
import {
  IconPlus,
  IconPlayerPlay,
  IconCheck,
  IconDotsVertical,
  IconArrowRight,
  IconTrash,
  IconInbox,
  IconCalendar,
} from '@tabler/icons-react';
import { JiraSprint, JiraTask } from '@/interfaces/jira';

interface BacklogViewProps {
  sprints: JiraSprint[];
  tasks: JiraTask[];
  canManageSprint: boolean;
  canCreateBacklog: boolean;
  onOpenCreateTask: (sprintId: string | null) => void;
  onOpenCreateSprint: () => void;
  onSelectTask: (task: JiraTask) => void;
  onMoveTaskToSprint: (taskId: string, sprintId: string | null) => void;
  onStartSprint: (sprintId: string) => void;
  onCompleteSprint: (sprintId: string) => void;
  onDeleteSprint: (sprintId: string) => void;
}

export function BacklogView({
  sprints,
  tasks,
  canManageSprint,
  canCreateBacklog,
  onOpenCreateTask,
  onOpenCreateSprint,
  onSelectTask,
  onMoveTaskToSprint,
  onStartSprint,
  onCompleteSprint,
  onDeleteSprint,
}: BacklogViewProps) {
  const backlogTasks = tasks.filter((t) => !t.sprintId || t.status === 'backlog');

  return (
    <Box
      className="hide-scrollbar"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 32px',
        backgroundColor: '#090d16',
        minHeight: 0,
      }}
    >
      <Box style={{ maxWidth: 1040, margin: '0 auto', width: '100%' }}>
        {/* Header Backlog & Sprints */}
        <Group justify="space-between" mb="xl">
          <Box>
            <Text fw={700} fz={18} c="#f0f6fc">
              Lập kế hoạch Sprint & Backlog
            </Text>
            <Text fz={12.5} c="#8b949e" mt={2}>
              Tổ chức công việc vào các chu kỳ phát triển (Sprint) hoặc quản lý tồn đọng (Backlog).
            </Text>
          </Box>

          <Group gap="xs">
            {canCreateBacklog && (
              <Button
                size="xs"
                variant="default"
                leftSection={<IconPlus size={14} />}
                onClick={() => onOpenCreateTask(null)}
                styles={{
                  root: {
                    backgroundColor: '#161b22',
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    color: '#c9d1d9',
                    borderRadius: 8,
                    '&:hover': {
                      backgroundColor: '#21262d',
                      color: '#ffffff',
                    },
                  },
                }}
              >
                Thêm vào Backlog
              </Button>
            )}

            {canManageSprint && (
              <Button
                size="xs"
                variant="filled"
                leftSection={<IconPlus size={14} />}
                onClick={onOpenCreateSprint}
                styles={{
                  root: {
                    backgroundColor: '#1f6feb',
                    color: '#ffffff',
                    fontWeight: 600,
                    borderRadius: 8,
                    '&:hover': { backgroundColor: '#388bfd' },
                  },
                }}
              >
                Tạo Sprint mới
              </Button>
            )}
          </Group>
        </Group>

        {/* Danh sách Sprints */}
        <Stack gap="lg">
          {sprints.map((sprint) => {
            const sprintTasks = tasks.filter((t) => t.sprintId === sprint.id);
            const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const doneTasks = sprintTasks.filter((t) => t.status === 'done');
            const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const progressPercent =
              sprintTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0;

            const isCompleted = sprint.status === 'completed';
            const isActive = sprint.status === 'active';

            return (
              <Paper
                key={sprint.id}
                p="md"
                bg="#161b22"
                radius="md"
                style={{
                  border: `1px solid ${isActive ? 'rgba(56, 139, 253, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Sprint Header */}
                <Group justify="space-between" mb="xs" wrap="wrap">
                  <Group gap="xs">
                    <Text fw={700} fz={15} c="#f0f6fc">
                      {sprint.name}
                    </Text>

                    <Badge
                      size="xs"
                      variant="filled"
                      styles={{
                        root: {
                          backgroundColor: isActive
                            ? 'rgba(46, 160, 67, 0.15)'
                            : isCompleted
                              ? 'rgba(139, 148, 158, 0.15)'
                              : 'rgba(56, 139, 253, 0.15)',
                          color: isActive ? '#3fb950' : isCompleted ? '#8b949e' : '#58a6ff',
                          border: `1px solid ${isActive ? '#2ea043' : isCompleted ? '#30363d' : '#388bfd'}44`,
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: 'uppercase',
                        },
                      }}
                    >
                      {sprint.status}
                    </Badge>

                    {sprint.startDate && sprint.endDate && (
                      <Group gap={4}>
                        <IconCalendar size={13} color="#8b949e" />
                        <Text fz={11.5} c="#8b949e">
                          {sprint.startDate} ~ {sprint.endDate}
                        </Text>
                      </Group>
                    )}
                  </Group>

                  <Group gap="xs">
                    <Badge
                      size="xs"
                      variant="outline"
                      styles={{
                        root: {
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#8b949e',
                          fontWeight: 600,
                        },
                      }}
                    >
                      {sprintTasks.length} việc • {totalPoints} SP
                    </Badge>

                    {canManageSprint && (
                      <>
                        {sprint.status === 'planned' && (
                          <Button
                            size="compact-xs"
                            variant="filled"
                            leftSection={<IconPlayerPlay size={12} />}
                            onClick={() => onStartSprint(sprint.id)}
                            styles={{
                              root: {
                                backgroundColor: '#238636',
                                color: '#ffffff',
                                fontWeight: 600,
                                borderRadius: 6,
                                '&:hover': { backgroundColor: '#2ea043' },
                              },
                            }}
                          >
                            Bắt đầu Sprint
                          </Button>
                        )}
                        {sprint.status === 'active' && (
                          <Button
                            size="compact-xs"
                            variant="default"
                            leftSection={<IconCheck size={12} color="#58a6ff" />}
                            onClick={() => onCompleteSprint(sprint.id)}
                            styles={{
                              root: {
                                backgroundColor: '#21262d',
                                borderColor: 'rgba(255, 255, 255, 0.12)',
                                color: '#f0f6fc',
                                borderRadius: 6,
                                '&:hover': { backgroundColor: '#30363d' },
                              },
                            }}
                          >
                            Hoàn thành Sprint
                          </Button>
                        )}

                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon size="sm" variant="subtle" color="gray">
                              <IconDotsVertical size={14} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown bg="#161b22" style={{ borderColor: '#30363d' }}>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={13} />}
                              onClick={() => onDeleteSprint(sprint.id)}
                            >
                              Xóa Sprint
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </>
                    )}
                  </Group>
                </Group>

                {sprint.goal && (
                  <Text fz={12} c="#8b949e" mb="sm" fs="italic">
                    Mục tiêu: {sprint.goal}
                  </Text>
                )}

                {/* Progress bar */}
                {sprintTasks.length > 0 && (
                  <Box mb="md">
                    <Group justify="space-between" mb={4}>
                      <Text fz={11} c="#8b949e">
                        Tiến độ: {doneTasks.length}/{sprintTasks.length} hoàn thành ({progressPercent}%)
                      </Text>
                      <Text fz={11} c="#8b949e">
                        {donePoints}/{totalPoints} SP
                      </Text>
                    </Group>
                    <Progress
                      value={progressPercent}
                      size="xs"
                      color="teal"
                      radius="xl"
                      styles={{ root: { backgroundColor: 'rgba(255, 255, 255, 0.08)' } }}
                    />
                  </Box>
                )}

                {/* Danh sách task trong Sprint */}
                <Stack gap={6}>
                  {sprintTasks.length === 0 ? (
                    <Box
                      py={24}
                      ta="center"
                      style={{
                        border: '1px dashed rgba(255, 255, 255, 0.08)',
                        borderRadius: 6,
                      }}
                    >
                      <Text fz={12} c="#6e7681">
                        Chưa có công việc nào trong Sprint này. Thêm việc hoặc chuyển từ Backlog vào.
                      </Text>
                    </Box>
                  ) : (
                    sprintTasks.map((t) => (
                      <Paper
                        key={t.id}
                        px="md"
                        py={10}
                        bg="#0d1117"
                        radius="sm"
                        style={{
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.12s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#161b22';
                          e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#0d1117';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        }}
                        onClick={() => onSelectTask(t)}
                      >
                        <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            fz={11.5}
                            fw={600}
                            c="#58a6ff"
                            ff="var(--font-geist-mono), monospace"
                            style={{ flexShrink: 0 }}
                          >
                            {t.id}
                          </Text>
                          <Text fz={13} fw={500} c="#e6edf3" truncate>
                            {t.title}
                          </Text>
                        </Group>

                        <Group gap="xs" style={{ flexShrink: 0 }}>
                          <Badge
                            size="xs"
                            variant="filled"
                            styles={{
                              root: {
                                backgroundColor:
                                  t.status === 'done'
                                    ? 'rgba(46, 160, 67, 0.15)'
                                    : t.status === 'in_progress'
                                      ? 'rgba(56, 139, 253, 0.15)'
                                      : 'rgba(255, 255, 255, 0.06)',
                                color:
                                  t.status === 'done'
                                    ? '#3fb950'
                                    : t.status === 'in_progress'
                                      ? '#79c0ff'
                                      : '#8b949e',
                                fontSize: 10,
                                fontWeight: 600,
                              },
                            }}
                          >
                            {t.status.toUpperCase()}
                          </Badge>

                          {typeof t.storyPoints === 'number' && (
                            <Badge
                              size="xs"
                              variant="outline"
                              styles={{
                                root: {
                                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                  borderColor: 'rgba(255, 255, 255, 0.08)',
                                  color: '#8b949e',
                                  fontSize: 10,
                                },
                              }}
                            >
                              {t.storyPoints} SP
                            </Badge>
                          )}

                          {t.assignee && (
                            <Avatar
                              src={t.assignee.avatar_url}
                              size={20}
                              radius="xl"
                              style={{ border: '1px solid #30363d' }}
                            >
                              {(t.assignee.name || t.assignee.login).slice(0, 2).toUpperCase()}
                            </Avatar>
                          )}

                          {canManageSprint && (
                            <Tooltip label="Chuyển về Backlog" withArrow>
                              <ActionIcon
                                size="xs"
                                variant="subtle"
                                color="gray"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveTaskToSprint(t.id, null);
                                }}
                              >
                                <IconArrowRight size={13} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Paper>
                    ))
                  )}

                  <Button
                    size="compact-xs"
                    variant="subtle"
                    color="gray"
                    leftSection={<IconPlus size={12} />}
                    onClick={() => onOpenCreateTask(sprint.id)}
                    style={{ alignSelf: 'flex-start', marginTop: 4, color: '#58a6ff', fontWeight: 600 }}
                  >
                    Thêm việc vào {sprint.name}
                  </Button>
                </Stack>
              </Paper>
            );
          })}

          {/* BACKLOG SECTION */}
          <Paper
            p="md"
            bg="#161b22"
            radius="md"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            }}
          >
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                <Text fw={700} fz={15} c="#f0f6fc">
                  📁 Backlog (Tồn đọng dự án)
                </Text>
                <Badge
                  size="xs"
                  variant="filled"
                  styles={{
                    root: {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#c9d1d9',
                      fontWeight: 600,
                      fontSize: 10,
                    },
                  }}
                >
                  {backlogTasks.length} việc
                </Badge>
              </Group>

              {canCreateBacklog && (
                <Button
                  size="compact-xs"
                  variant="default"
                  leftSection={<IconPlus size={12} />}
                  onClick={() => onOpenCreateTask(null)}
                  styles={{
                    root: {
                      backgroundColor: '#21262d',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#c9d1d9',
                      borderRadius: 6,
                      '&:hover': { backgroundColor: '#30363d', color: '#ffffff' },
                    },
                  }}
                >
                  Thêm vào Backlog
                </Button>
              )}
            </Group>

            <Stack gap={6}>
              {backlogTasks.length === 0 ? (
                <Box
                  py={28}
                  ta="center"
                  style={{
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                    borderRadius: 6,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <IconInbox size={20} color="#6e7681" />
                  <Text fz={12} c="#6e7681">
                    Backlog đang trống.
                  </Text>
                </Box>
              ) : (
                backlogTasks.map((t) => (
                  <Paper
                    key={t.id}
                    px="md"
                    py={10}
                    bg="#0d1117"
                    radius="sm"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#161b22';
                      e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0d1117';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onClick={() => onSelectTask(t)}
                  >
                    <Group gap="sm" style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        fz={11.5}
                        fw={600}
                        c="#8b949e"
                        ff="var(--font-geist-mono), monospace"
                        style={{ flexShrink: 0 }}
                      >
                        {t.id}
                      </Text>
                      <Text fz={13} fw={500} c="#e6edf3" truncate>
                        {t.title}
                      </Text>
                    </Group>

                    <Group gap="xs" style={{ flexShrink: 0 }}>
                      {typeof t.storyPoints === 'number' && (
                        <Badge
                          size="xs"
                          variant="outline"
                          styles={{
                            root: {
                              backgroundColor: 'rgba(255, 255, 255, 0.03)',
                              borderColor: 'rgba(255, 255, 255, 0.08)',
                              color: '#8b949e',
                              fontSize: 10,
                            },
                          }}
                        >
                          {t.storyPoints} SP
                        </Badge>
                      )}

                      {/* Dropdown chuyển vào Sprint */}
                      {canManageSprint && sprints.length > 0 && (
                        <Menu shadow="md" width={180} position="bottom-end">
                          <Menu.Target>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="blue"
                              rightSection={<IconArrowRight size={11} />}
                              onClick={(e) => e.stopPropagation()}
                              styles={{
                                root: {
                                  color: '#58a6ff',
                                  '&:hover': { backgroundColor: 'rgba(56, 139, 253, 0.1)' },
                                },
                              }}
                            >
                              Vào Sprint
                            </Button>
                          </Menu.Target>
                          <Menu.Dropdown bg="#161b22" style={{ borderColor: '#30363d' }}>
                            <Menu.Label c="#8b949e">Chọn Sprint</Menu.Label>
                            {sprints.map((s) => (
                              <Menu.Item
                                key={s.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveTaskToSprint(t.id, s.id);
                                }}
                              >
                                {s.name}
                              </Menu.Item>
                            ))}
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>
                  </Paper>
                ))
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
