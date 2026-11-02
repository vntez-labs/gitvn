"use client";

import {
  Alert,
  Badge,
  Box,
  Button,
  FileInput,
  Group,
  Paper,
  Radio,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconFileImport,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react";
import axios from "axios";
import { useMemo, useState } from "react";
import type { JiraBoardData, JiraSprint, JiraTask } from "@/interfaces/jira";

interface TasksImportTabProps {
  currentBoardData: JiraBoardData | null;
  owner: string;
  repo: string;
  syncToGitHub: boolean;
  onSavedSuccess: (updatedData: JiraBoardData) => void;
  onClose: () => void;
}

export function TasksImportTab({
  currentBoardData,
  owner,
  repo,
  syncToGitHub,
  onSavedSuccess,
  onClose,
}: TasksImportTabProps) {
  const [inputText, setInputText] = useState("");
  const [importMode, setImportMode] = useState<"overwrite" | "merge">(
    "overwrite",
  );
  const [importing, setImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Parse & validate JSON live
  const parsedPreview = useMemo(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return null;

    try {
      const obj = JSON.parse(trimmed);
      let tasks: JiraTask[] = [];
      let sprints: JiraSprint[] = [];

      if (Array.isArray(obj)) {
        tasks = obj;
      } else if (typeof obj === "object" && obj !== null) {
        tasks = Array.isArray(obj.tasks) ? obj.tasks : [];
        sprints = Array.isArray(obj.sprints) ? obj.sprints : [];
      }

      return {
        valid: true,
        taskCount: tasks.length,
        sprintCount: sprints.length,
        parsedData: obj,
      };
    } catch (err: any) {
      return {
        valid: false,
        error: `Lỗi cú pháp JSON: ${err.message}`,
      };
    }
  }, [inputText]);

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInputText(text || "");
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedPreview || !parsedPreview.valid) return;
    setImporting(true);

    try {
      const incoming = parsedPreview.parsedData;
      let finalTasks: JiraTask[] = [];
      let finalSprints: JiraSprint[] = [];

      const incomingTasks: JiraTask[] = Array.isArray(incoming)
        ? incoming
        : Array.isArray(incoming.tasks)
          ? incoming.tasks
          : [];
      const incomingSprints: JiraSprint[] = Array.isArray(incoming.sprints)
        ? incoming.sprints
        : [];

      if (importMode === "overwrite") {
        finalTasks = incomingTasks;
        finalSprints =
          incomingSprints.length > 0
            ? incomingSprints
            : currentBoardData?.sprints || [];
      } else {
        // Merge: giữ task cũ, thêm task mới nếu chưa có id
        const taskMap = new Map<string, JiraTask>();
        (currentBoardData?.tasks || []).forEach((t) => taskMap.set(t.id, t));
        incomingTasks.forEach((t) => taskMap.set(t.id, t));
        finalTasks = Array.from(taskMap.values());

        const sprintMap = new Map<string, JiraSprint>();
        (currentBoardData?.sprints || []).forEach((s) =>
          sprintMap.set(s.id, s),
        );
        incomingSprints.forEach((s) => sprintMap.set(s.id, s));
        finalSprints = Array.from(sprintMap.values());
      }

      const finalBoardData: JiraBoardData = {
        owner,
        repo,
        taskSeq:
          incoming.taskSeq ||
          currentBoardData?.taskSeq ||
          finalTasks.length + 1,
        tasks: finalTasks,
        sprints: finalSprints,
        permissions: incoming.permissions ||
          currentBoardData?.permissions || {
            userRoles: {},
            defaultRole: "member",
            canManageSprint: ["admin", "pm"],
            canCreateBacklog: ["admin", "pm", "member"],
          },
      };

      const res = await axios.post("/api/jira", {
        owner,
        repo,
        data: finalBoardData,
        forceGitHubSync: syncToGitHub,
      });

      notifications.show({
        title: "Nhập dữ liệu thành công!",
        message: `Đã áp dụng ${finalTasks.length} tasks và ${finalSprints.length} sprints vào .gitvn/tasks.json!`,
        color: "teal",
        icon: <IconCheck size={16} />,
      });

      onSavedSuccess(res.data.data);
      onClose();
    } catch (err: any) {
      notifications.show({
        title: "Nhập dữ liệu thất bại",
        message: err.response?.data?.error || err.message || "Lỗi lưu dữ liệu",
        color: "red",
      });
    } finally {
      setImporting(false);
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
          <FileInput
            size="xs"
            placeholder="Tải lên file tasks.json từ máy tính..."
            accept=".json,application/json"
            leftSection={<IconUpload size={14} />}
            onChange={handleFileUpload}
            clearable
            style={{ flex: 1, minWidth: 240 }}
          />

          <Radio.Group
            value={importMode}
            onChange={(val) => setImportMode(val as any)}
            size="xs"
          >
            <Group gap="sm">
              <Radio value="overwrite" label="Ghi đè (Overwrite)" />
              <Radio value="merge" label="Hợp nhất (Merge)" />
            </Group>
          </Radio.Group>
        </Group>
      </Paper>

      {/* Hiển thị trạng thái phân tích JSON */}
      {parsedPreview &&
        (parsedPreview.valid ? (
          <Alert color="teal" icon={<IconCheck size={16} />} py={8}>
            <Group gap="xs">
              <Text fz={12} fw={600}>
                Cấu trúc JSON hợp lệ:
              </Text>
              <Badge size="xs" color="teal">
                {parsedPreview.taskCount} tasks
              </Badge>
              <Badge size="xs" color="blue">
                {parsedPreview.sprintCount} sprints
              </Badge>
              {uploadedFileName && (
                <Text fz={11} c="#64748b">
                  (Từ file: {uploadedFileName})
                </Text>
              )}
            </Group>
          </Alert>
        ) : (
          <Alert color="red" icon={<IconAlertCircle size={16} />} py={8}>
            <Text fz={12}>{parsedPreview.error}</Text>
          </Alert>
        ))}

      <Textarea
        placeholder="Hoặc dán nội dung JSON vào đây (vd: { tasks: [...], sprints: [...] })..."
        value={inputText}
        onChange={(e) => setInputText(e.currentTarget.value)}
        rows={11}
        styles={{
          input: {
            backgroundColor: "#ffffff",
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
        <Button
          variant="default"
          size="xs"
          onClick={onClose}
          disabled={importing}
        >
          Hủy
        </Button>
        <Button
          color="vntez"
          size="xs"
          loading={importing}
          disabled={!parsedPreview || !parsedPreview.valid}
          leftSection={<IconFileImport size={14} />}
          onClick={handleExecuteImport}
        >
          Áp dụng & Lưu vào .gitvn/tasks.json
        </Button>
      </Group>
    </Stack>
  );
}
