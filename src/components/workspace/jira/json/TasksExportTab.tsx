"use client";

import {
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconCopy,
  IconDownload,
  IconFileCode,
} from "@tabler/icons-react";
import type { JiraBoardData } from "@/interfaces/jira";

interface TasksExportTabProps {
  boardData: JiraBoardData | null;
  owner: string;
  repo: string;
}

export function TasksExportTab({
  boardData,
  owner,
  repo,
}: TasksExportTabProps) {
  const jsonString = JSON.stringify(
    boardData || { tasks: [], sprints: [] },
    null,
    2,
  );
  const taskCount = boardData?.tasks?.length || 0;
  const sprintCount = boardData?.sprints?.length || 0;

  const handleDownload = () => {
    try {
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${repo || "gitvn"}-tasks.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notifications.show({
        title: "Tải xuống thành công",
        message: `Đã lưu file ${repo || "gitvn"}-tasks.json về máy tính của bạn`,
        color: "teal",
        icon: <IconCheck size={16} />,
      });
    } catch (err: any) {
      notifications.show({
        title: "Lỗi tải file",
        message: err.message || "Không thể tải file về máy",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="sm">
      <Paper
        p="xs"
        radius="md"
        style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
      >
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs">
            <IconFileCode size={16} color="#fb291a" />
            <Text fz={12} fw={600} c="#1e293b">
              Xuất dữ liệu Kanban .gitvn/tasks.json
            </Text>
            <Badge size="xs" variant="light" color="vntez">
              {taskCount} việc
            </Badge>
            <Badge size="xs" variant="light" color="teal">
              {sprintCount} sprints
            </Badge>
          </Group>

          <Group gap="xs">
            <CopyButton value={jsonString}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="default"
                  leftSection={
                    copied ? <IconCheck size={12} /> : <IconCopy size={12} />
                  }
                  onClick={() => {
                    copy();
                    notifications.show({
                      title: "Đã sao chép",
                      message: "Nội dung JSON đã được lưu vào clipboard",
                      color: "teal",
                      icon: <IconCheck size={16} />,
                    });
                  }}
                >
                  {copied ? "Đã sao chép" : "Sao chép JSON"}
                </Button>
              )}
            </CopyButton>

            <Button
              size="compact-xs"
              color="vntez"
              leftSection={<IconDownload size={12} />}
              onClick={handleDownload}
            >
              Tải file .json
            </Button>
          </Group>
        </Group>
      </Paper>

      <Textarea
        readOnly
        value={jsonString}
        rows={14}
        styles={{
          input: {
            backgroundColor: "#f8fafc",
            borderColor: "#cbd5e1",
            color: "#0f172a",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 12,
            lineHeight: 1.5,
            borderRadius: 8,
          },
        }}
      />
    </Stack>
  );
}
