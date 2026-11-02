"use client";

import { Badge, Group, Modal, Stack, Switch, Tabs, Text } from "@mantine/core";
import {
  IconBrandGithub,
  IconDownload,
  IconEdit,
  IconFileCode,
  IconUpload,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import type { JiraBoardData } from "@/interfaces/jira";
import { TasksExportTab } from "./json/TasksExportTab";
import { TasksImportTab } from "./json/TasksImportTab";
import { TasksRawEditorTab } from "./json/TasksRawEditorTab";

interface TasksJsonModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  boardData: JiraBoardData | null;
  onSavedSuccess: (updatedData: JiraBoardData) => void;
}

export function TasksJsonModal({
  opened,
  onClose,
  owner,
  repo,
  boardData,
  onSavedSuccess,
}: TasksJsonModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("import");
  const [syncToGitHub, setSyncToGitHub] = useState(true);

  const initialJson = boardData
    ? JSON.stringify(boardData, null, 2)
    : JSON.stringify({ tasks: [], sprints: [] }, null, 2);

  const taskCount = boardData?.tasks?.length || 0;
  const sprintCount = boardData?.sprints?.length || 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconFileCode size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#1e293b">
            Quản Lý & Import / Export .gitvn/tasks.json
          </Text>
          <Badge size="xs" variant="light" color="vntez">
            {taskCount} việc • {sprintCount} sprints
          </Badge>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          borderRadius: 12,
        },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
        },
      }}
    >
      <Stack gap="sm">
        {/* Tuỳ chọn commit lên GitHub */}
        <Group justify="space-between" align="center" wrap="wrap">
          <Switch
            size="xs"
            checked={syncToGitHub}
            onChange={(e) => setSyncToGitHub(e.currentTarget.checked)}
            label={
              <Group gap={4}>
                <IconBrandGithub size={13} />
                <Text fz={12} c="#334155" fw={500}>
                  Tự động đồng bộ commit lên GitHub (.gitvn/tasks.json)
                </Text>
              </Group>
            }
            color="vntez"
          />
        </Group>

        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          color="vntez"
          radius="sm"
        >
          <Tabs.List mb="xs">
            <Tabs.Tab value="import" leftSection={<IconUpload size={14} />}>
              Import JSON (Nhập dữ liệu)
            </Tabs.Tab>
            <Tabs.Tab value="export" leftSection={<IconDownload size={14} />}>
              Export JSON (Xuất file)
            </Tabs.Tab>
            <Tabs.Tab value="raw" leftSection={<IconEdit size={14} />}>
              Chỉnh sửa Raw
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="import">
            <TasksImportTab
              currentBoardData={boardData}
              owner={owner}
              repo={repo}
              syncToGitHub={syncToGitHub}
              onSavedSuccess={onSavedSuccess}
              onClose={onClose}
            />
          </Tabs.Panel>

          <Tabs.Panel value="export">
            <TasksExportTab boardData={boardData} owner={owner} repo={repo} />
          </Tabs.Panel>

          <Tabs.Panel value="raw">
            <TasksRawEditorTab
              key={initialJson}
              initialJson={initialJson}
              owner={owner}
              repo={repo}
              syncToGitHub={syncToGitHub}
              onSavedSuccess={onSavedSuccess}
              onClose={onClose}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  );
}
