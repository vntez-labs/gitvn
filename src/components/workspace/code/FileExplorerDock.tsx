"use client";

import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconFilePlus, IconSearch } from "@tabler/icons-react";
import { type FC, memo, useState } from "react";
import { FileTree, type TreeNode } from "@/components/FileTree";

interface FileExplorerDockProps {
  tree: TreeNode[];
  activeFile: string | null;
  onSelectFile: (path: string) => void;
  onCreateFileClick: () => void;
}

export const FileExplorerDock: FC<FileExplorerDockProps> = memo(
  function FileExplorerDock({
    tree,
    activeFile,
    onSelectFile,
    onCreateFileClick,
  }) {
    const [search, setSearch] = useState("");
    const query = search.trim().toLowerCase();
    const matches = query
      ? tree.filter(
          (node) =>
            node.type === "blob" && node.path.toLowerCase().includes(query),
        )
      : [];
    return (
      <Box
        style={{
          backgroundColor: "#fafafa",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
          height: "100%",
        }}
      >
        <Box
          p="xs"
          px="md"
          style={{
            borderBottom: "1px solid #e4e4e7",
            backgroundColor: "#fafafa",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Text
            fz={11}
            fw={700}
            c="#71717a"
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
              style={{
                backgroundColor: "#f4f4f5",
                borderColor: "#e4e4e7",
                color: "#52525b",
                fontFamily: "monospace",
                fontSize: 11,
                padding: "2px 6px",
              }}
            >
              {tree.length} files
            </Badge>
            <Tooltip label="Tạo file mới" withArrow>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="red"
                onClick={onCreateFileClick}
              >
                <IconFilePlus size={15} color="#dc2626" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>

        <TextInput
          mx="xs"
          mt="xs"
          size="xs"
          aria-label="Tìm file theo tên hoặc đường dẫn"
          placeholder="Tìm file…"
          leftSection={<IconSearch size={13} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Box
          style={{
            flex: 1,
            overflowX: "auto",
            overflowY: "auto",
            padding: "8px 4px",
            minHeight: 0,
          }}
        >
          {query ? (
            matches.length ? (
              <>
                {matches.slice(0, 100).map((file) => (
                  <UnstyledButton
                    key={file.path}
                    display="block"
                    w="100%"
                    px="xs"
                    py={4}
                    onClick={() => onSelectFile(file.path)}
                  >
                    <Text size="xs" truncate title={file.path}>
                      {file.path}
                    </Text>
                  </UnstyledButton>
                ))}
                {matches.length > 100 && (
                  <Text size="xs" c="dimmed" px="xs">
                    Hiện 100/{matches.length} file. Nhập thêm để thu hẹp.
                  </Text>
                )}
              </>
            ) : (
              <Text size="xs" c="dimmed" ta="center">
                Không tìm thấy file.
              </Text>
            )
          ) : tree.length === 0 ? (
            <Text fz="xs" c="#a1a1aa" ta="center" mt="xl">
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
  },
);
