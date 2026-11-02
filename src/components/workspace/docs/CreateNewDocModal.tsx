"use client";

import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconFolderPlus } from "@tabler/icons-react";

interface CreateNewDocModalProps {
  opened: boolean;
  onClose: () => void;
  newDocName: string;
  setNewDocName: (name: string) => void;
  onCreateDoc: () => void;
}

export function CreateNewDocModal({
  opened,
  onClose,
  newDocName,
  setNewDocName,
  onCreateDoc,
}: CreateNewDocModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFolderPlus size={18} color="#fb291a" />
          <Text fw={600} fz={15} c="#0f172a">
            Tạo tài liệu mới trong .gitvn/docs
          </Text>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        },
      }}
    >
      <Stack gap="md" mt="xs">
        <TextInput
          label="Tên file tài liệu"
          description="Ví dụ: guide, api-specs, deployment (tự động thêm đuôi .mdx)"
          placeholder="api-guide"
          value={newDocName}
          onChange={(e) => setNewDocName(e.currentTarget.value)}
          required
          styles={{ input: { fontFamily: "monospace" } }}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Hủy
          </Button>
          <Button
            color="vntez"
            onClick={onCreateDoc}
            disabled={!newDocName.trim()}
          >
            Tạo tài liệu
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
