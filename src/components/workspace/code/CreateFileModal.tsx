"use client";

import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconFilePlus } from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";

interface CreateFileModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  branch: string;
  onSuccess: (newFilePath: string) => void;
}

export function CreateFileModal({
  opened,
  onClose,
  owner,
  repo,
  branch,
  onSuccess,
}: CreateFileModalProps) {
  const [filePath, setFilePath] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const trimmedPath = filePath.trim().replace(/^\/+/, "");
    if (!trimmedPath) {
      notifications.show({
        title: "Thiếu tên file",
        message: "Vui lòng nhập đường dẫn file (ví dụ: src/utils.ts)",
        color: "red",
      });
      return;
    }

    setLoading(true);
    try {
      const commitMsg = message.trim() || `feat: create ${trimmedPath}`;
      const res = await axios.put("/api/github/content", {
        owner,
        repo,
        path: trimmedPath,
        branch,
        content,
        message: commitMsg,
      });

      if (res.data.success) {
        notifications.show({
          title: "Tạo file thành công!",
          message: `Đã tạo ${trimmedPath} trên branch ${branch}`,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        setFilePath("");
        setContent("");
        setMessage("");
        onSuccess(trimmedPath);
        onClose();
      }
    } catch (err: any) {
      notifications.show({
        title: "Tạo file thất bại",
        message: err.response?.data?.error || err.message,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFilePlus size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#0f172a">
            Tạo file mới vào branch {branch}
          </Text>
        </Group>
      }
      styles={{
        content: { borderRadius: 12 },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
        },
        body: { padding: 20 },
      }}
    >
      <Stack gap="md">
        <TextInput
          label="Đường dẫn file (kèm đuôi mở rộng)"
          placeholder="ví dụ: src/services/api.ts hoặc docs/guide.md"
          value={filePath}
          onChange={(e) => setFilePath(e.currentTarget.value)}
          required
          styles={{
            input: { fontFamily: "monospace", fontSize: 13 },
            label: { fontWeight: 600, fontSize: 12, marginBottom: 4 },
          }}
        />

        <Textarea
          label="Nội dung file"
          placeholder="Nhập mã nguồn hoặc nội dung khởi tạo..."
          value={content}
          onChange={(e) => setContent(e.currentTarget.value)}
          minRows={6}
          maxRows={12}
          autosize
          styles={{
            input: { fontFamily: "monospace", fontSize: 12 },
            label: { fontWeight: 600, fontSize: 12, marginBottom: 4 },
          }}
        />

        <TextInput
          label="Thông điệp commit (tùy chọn)"
          placeholder="ví dụ: feat: add api service module"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          styles={{
            label: { fontWeight: 600, fontSize: 12, marginBottom: 4 },
          }}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="default" size="xs" onClick={onClose}>
            Hủy
          </Button>
          <Button
            color="vntez"
            size="xs"
            leftSection={<IconFilePlus size={14} />}
            onClick={handleCreate}
            loading={loading}
          >
            Tạo file & Commit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
