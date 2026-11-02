"use client";

import { ActionIcon, Box, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconBook, IconFileText, IconPlus } from "@tabler/icons-react";
import { useMemo } from "react";
import type { GitvnDocItem } from "@/interfaces/gitvn";

interface DocsSidebarProps {
  docs: GitvnDocItem[];
  activeDocId: string;
  onSelectDoc: (doc: GitvnDocItem) => void;
  onOpenNewDocModal: () => void;
}

export function DocsSidebar({
  docs,
  activeDocId,
  onSelectDoc,
  onOpenNewDocModal,
}: DocsSidebarProps) {
  // Deduplicate docs by id/name
  const uniqueDocs = useMemo(() => {
    const seen = new Set<string>();
    return docs.filter((d) => {
      const key = (d.name || d.id || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [docs]);
  return (
    <Box
      style={{
        borderRight: "1px solid #e2e8f0",
        backgroundColor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Group
        justify="space-between"
        px="md"
        py={12}
        style={{ borderBottom: "1px solid #e2e8f0" }}
      >
        <Group gap={6}>
          <IconBook size={16} color="#fb291a" />
          <Text
            fz={12}
            fw={700}
            c="#475569"
            style={{ letterSpacing: "0.06em" }}
          >
            DOCS (MDX)
          </Text>
        </Group>
        <Tooltip label="Tạo tài liệu mới" withArrow>
          <ActionIcon
            size="sm"
            variant="light"
            color="vntez"
            onClick={onOpenNewDocModal}
          >
            <IconPlus size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Box
        style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}
        className="hide-scrollbar"
      >
        <Stack gap={2}>
          {uniqueDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            const tooltipLabel =
              doc.title && doc.title !== doc.name
                ? `${doc.title} (${doc.name})`
                : doc.name;

            return (
              <Tooltip
                key={doc.id}
                label={tooltipLabel}
                position="right"
                openDelay={400}
                withArrow
              >
                <Box
                  onClick={() => onSelectDoc(doc)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    backgroundColor: isActive ? "#fff1f0" : "transparent",
                    borderLeft: isActive
                      ? "3px solid #fb291a"
                      : "3px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "all 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <IconFileText
                    size={15}
                    color={isActive ? "#fb291a" : "#64748b"}
                    style={{ flexShrink: 0 }}
                  />
                  <Text
                    fz={13}
                    fw={isActive ? 600 : 400}
                    c={isActive ? "#fb291a" : "#334155"}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {doc.name}
                  </Text>
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Box>

      <Box
        p="xs"
        style={{ borderTop: "1px solid #e2e8f0", backgroundColor: "#f1f5f9" }}
      >
        <Text fz={11} c="#64748b" ta="center">
          Vị trí lưu: <code style={{ color: "#fb291a" }}>.gitvn/docs/</code>
        </Text>
      </Box>
    </Box>
  );
}
