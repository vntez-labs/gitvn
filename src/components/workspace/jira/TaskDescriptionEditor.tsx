"use client";

import { Box, Group, Tabs, Text, Textarea } from "@mantine/core";
import { IconEdit, IconEye } from "@tabler/icons-react";
import { useState } from "react";
import { MarkdownViewer } from "@/components/MarkdownViewer";

interface TaskDescriptionEditorProps {
  description: string;
  setDescription: (val: string) => void;
  canEdit: boolean;
}

export function TaskDescriptionEditor({
  description,
  setDescription,
  canEdit,
}: TaskDescriptionEditorProps) {
  const [descTab, setDescTab] = useState<"write" | "preview">("preview");

  return (
    <Box>
      <Group justify="space-between" mb={6}>
        <Text fz={12} fw={600} c="#334155">
          Mô tả chi tiết (Markdown)
        </Text>

        <Tabs
          value={descTab}
          onChange={(val) => setDescTab(val as "write" | "preview")}
          styles={{
            list: { border: "none" },
            tab: {
              fontSize: 11,
              padding: "4px 10px",
              color: "#64748b",
              "&[data-active]": { color: "#fb291a", fontWeight: 600 },
            },
          }}
        >
          <Tabs.List>
            <Tabs.Tab value="preview" leftSection={<IconEye size={12} />}>
              Xem trước
            </Tabs.Tab>
            {canEdit && (
              <Tabs.Tab value="write" leftSection={<IconEdit size={12} />}>
                Soạn thảo
              </Tabs.Tab>
            )}
          </Tabs.List>
        </Tabs>
      </Group>

      {descTab === "write" && canEdit ? (
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          placeholder="Sử dụng Markdown để viết yêu cầu, checklist (- [ ]), code block..."
          rows={6}
          styles={{
            input: {
              backgroundColor: "#ffffff",
              borderColor: "#cbd5e1",
              color: "#0f172a",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 13,
              lineHeight: 1.6,
              borderRadius: 8,
            },
          }}
        />
      ) : (
        <Box
          py="xs"
          px={4}
          style={{
            backgroundColor: "transparent",
            border: "none",
            minHeight: 80,
          }}
        >
          {description ? (
            <MarkdownViewer content={description} />
          ) : (
            <Text fz="xs" c="#94a3b8" fs="italic">
              Chưa có mô tả chi tiết cho task này.
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
