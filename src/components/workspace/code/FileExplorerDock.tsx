"use client";

import { ActionIcon, Badge, Box, Group, Text, Tooltip } from "@mantine/core";
import { IconFilePlus } from "@tabler/icons-react";
import type { FC } from "react";
import { FileTree, type TreeNode } from "@/components/FileTree";

interface FileExplorerDockProps {
  tree: TreeNode[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onCreateFileClick: () => void;
}

export const FileExplorerDock: FC<FileExplorerDockProps> = ({
  tree,
  activeFile,
  onSelectFile,
  onCreateFileClick,
}) => {
  return (
    <Box
      style={{
        borderRight: "1px solid #27272a",
        backgroundColor: "#18181b",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      <Box
        p="xs"
        px="md"
        style={{
          borderBottom: "1px solid #27272a",
          backgroundColor: "#18181b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          fz={11}
          fw={700}
          c="#a1a1aa"
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "monospace",
          }}
        >
          Files
        </Text>
        <Group gap={6}>
          <Badge
            size="xs"
            variant="outline"
            color="gray"
            style={{
              borderColor: "#3f3f46",
              color: "#a1a1aa",
              fontFamily: "monospace",
            }}
          >
            {tree.length} files
          </Badge>
          <Tooltip label="Tạo file mới" withArrow>
            <ActionIcon
              size="xs"
              variant="subtle"
              color="blue"
              onClick={onCreateFileClick}
            >
              <IconFilePlus size={15} color="#60a5fa" />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>

      <Box
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 8,
          minHeight: 0,
        }}
      >
        {tree.length === 0 ? (
          <Text fz="xs" c="#71717a" ta="center" mt="xl">
            Không có file nào trong thư mục này
          </Text>
        ) : (
          <FileTree
            data={tree}
            activePath={activeFile}
            onFileClick={onSelectFile}
          />
        )}
      </Box>
    </Box>
  );
};
