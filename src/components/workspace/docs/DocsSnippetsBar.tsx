"use client";

import { Box, Button, Text } from "@mantine/core";
import { IconCode, IconListCheck, IconTable } from "@tabler/icons-react";

interface DocsSnippetsBarProps {
  onInsert: (snippet: string) => void;
}

export function DocsSnippetsBar({ onInsert }: DocsSnippetsBarProps) {
  return (
    <Box
      px="lg"
      py={6}
      style={{
        borderBottom: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <Text fz={11} fw={600} c="#64748b">
        Chèn nhanh:
      </Text>
      <Button
        size="compact-xs"
        variant="default"
        onClick={() =>
          onInsert("> [!NOTE]\n> Nội dung ghi chú quan trọng ở đây.")
        }
      >
        [!NOTE]
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        onClick={() => onInsert("> [!TIP]\n> Mẹo hữu ích và tối ưu.")}
      >
        [!TIP]
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        onClick={() =>
          onInsert("> [!WARNING]\n> Cảnh báo lưu ý trước khi thao tác.")
        }
      >
        [!WARNING]
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        leftSection={<IconCode size={12} />}
        onClick={() =>
          onInsert('```typescript\nconsole.log("Hello GitVN!");\n```')
        }
      >
        Code Block
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        leftSection={<IconListCheck size={12} />}
        onClick={() =>
          onInsert(
            "- [ ] Việc cần làm 1\n- [ ] Việc cần làm 2\n- [x] Đã hoàn thành",
          )
        }
      >
        Task List
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        leftSection={<IconTable size={12} />}
        onClick={() =>
          onInsert(
            "| Tiêu đề 1 | Tiêu đề 2 |\n| :--- | :--- |\n| Giá trị A | Giá trị B |",
          )
        }
      >
        Bảng biểu
      </Button>
    </Box>
  );
}
