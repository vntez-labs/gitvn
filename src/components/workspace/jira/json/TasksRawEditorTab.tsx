"use client";

import {
  Alert,
  Button,
  CopyButton,
  Group,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconDeviceFloppy,
  IconRefresh,
} from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";
import type { JiraBoardData } from "@/interfaces/jira";

interface TasksRawEditorTabProps {
  initialJson: string;
  owner: string;
  repo: string;
  syncToGitHub: boolean;
  onSavedSuccess: (updatedData: JiraBoardData) => void;
  onClose: () => void;
}

export function TasksRawEditorTab({
  initialJson,
  owner,
  repo,
  syncToGitHub,
  onSavedSuccess,
  onClose,
}: TasksRawEditorTabProps) {
  const [jsonText, setJsonText] = useState(initialJson);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setParseError(null);
    } catch (err: any) {
      setParseError(`JSON không hợp lệ: ${err.message}`);
    }
  };

  const handleSave = async () => {
    try {
      const parsed = JSON.parse(jsonText);
      setParseError(null);

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

  return (
    <Stack gap="sm">
      <Group justify="flex-end" gap="xs">
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
      </Group>

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

      <Textarea
        value={jsonText}
        onChange={(e) => {
          setJsonText(e.currentTarget.value);
          if (parseError) setParseError(null);
        }}
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

      <Group justify="flex-end" gap="xs">
        <Button variant="default" size="xs" onClick={onClose} disabled={saving}>
          Hủy
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
    </Stack>
  );
}
