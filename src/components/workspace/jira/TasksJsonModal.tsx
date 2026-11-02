"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  CopyButton,
  Group,
  Loader,
  Modal,
  Stack,
  Switch,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconBrandGithub,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconFileCode,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import type { JiraBoardData } from "@/interfaces/jira";

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
  const [jsonText, setJsonText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncToGitHub, setSyncToGitHub] = useState(true);

  // Load JSON text mỗi khi mở modal
  useEffect(() => {
    if (opened && boardData) {
      setJsonText(JSON.stringify(boardData, null, 2));
      setParseError(null);
    }
  }, [opened, boardData]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err: any) {
      setParseError(`JSON không hợp lệ: ${err.message}`);
    }
  };

  const handleCopy = () => {
    notifications.show({
      title: "Đã sao chép",
      message: "Nội dung .gitvn/tasks.json đã được lưu vào clipboard",
      color: "teal",
      icon: <IconCheck size={16} />,
    });
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      setParseError(null);

      // Validate cấu trúc tối thiểu
      if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.sprints)) {
        setParseError('Cấu trúc thiếu mảng "tasks" hoặc "sprints"');
        return;
      }

      setSaving(true);
      const res = await axios.post("/api/jira", {
        owner,
        repo,
        data: parsed,
        forceGitHubSync: syncToGitHub,
      });

      notifications.show({
        title: "Lưu thành công!",
        message: "File .gitvn/tasks.json đã được cập nhật thành công!",
        color: "teal",
        icon: <IconCheck size={16} />,
      });

      onSavedSuccess(res.data.data);
      onClose();
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setParseError(`Lỗi cú pháp JSON: ${err.message}`);
      } else {
        const errorMsg = err.response?.data?.error || err.message;
        setParseError(`Lỗi khi lưu lên server: ${errorMsg}`);
      }
    } finally {
      setSaving(false);
    }
  };

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
          <Text fw={700} fz={15} c="#0f172a">
            Trình Chỉnh Sửa Trực Tiếp .gitvn/tasks.json
          </Text>
          <Badge size="xs" variant="light" color="vntez">
            Raw JSON Engine
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
        {/* Thanh trạng thái & Tools */}
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs">
            <Badge size="sm" variant="light" color="vntez">
              {taskCount} tasks
            </Badge>
            <Badge size="sm" variant="light" color="teal">
              {sprintCount} sprints
            </Badge>
          </Group>

          <Group gap="xs">
            <Button
              size="compact-xs"
              variant="default"
              leftSection={<IconRefresh size={12} />}
              onClick={handleFormat}
            >
              Format JSON
            </Button>

            <CopyButton value={jsonText}>
              {({ copied, copy }) => (
                <Button
                  size="compact-xs"
                  variant="default"
                  leftSection={
                    copied ? <IconCheck size={12} /> : <IconCopy size={12} />
                  }
                  onClick={() => {
                    copy();
                    handleCopy();
                  }}
                >
                  {copied ? "Đã sao chép" : "Copy JSON"}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Group>

        {/* Cảnh báo lỗi Parse nếu có */}
        {parseError && (
          <Alert
            color="red"
            icon={<IconAlertCircle size={16} />}
            title="Lỗi cú pháp"
            withCloseButton
            onClose={() => setParseError(null)}
          >
            {parseError}
          </Alert>
        )}

        {/* Textarea Editor hiển thị raw JSON */}
        <Textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.currentTarget.value);
            if (parseError) setParseError(null);
          }}
          rows={16}
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

        {/* Footer: Tuỳ chọn sync GitHub và nút bấm */}
        <Group
          justify="space-between"
          align="center"
          mt="xs"
          wrap="wrap"
          gap="sm"
        >
          <Group gap="xs">
            <Switch
              size="xs"
              checked={syncToGitHub}
              onChange={(e) => setSyncToGitHub(e.currentTarget.checked)}
              label={
                <Group gap={4}>
                  <IconBrandGithub size={13} />
                  <Text fz={12} c="#334155" fw={500}>
                    Tự động commit lên GitHub
                  </Text>
                </Group>
              }
              color="vntez"
            />
          </Group>

          <Group gap="xs">
            <Button
              variant="default"
              size="xs"
              onClick={onClose}
              disabled={saving}
            >
              Đóng
            </Button>
            <Button
              color="vntez"
              size="xs"
              loading={saving}
              leftSection={<IconDeviceFloppy size={14} />}
              onClick={handleSave}
            >
              Lưu vào .gitvn/tasks.json
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
