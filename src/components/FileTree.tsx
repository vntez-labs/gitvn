"use client";

import { Box, Collapse, Group, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { memo, useEffect, useMemo, useState } from "react";
import {
  getIconForFile,
  getIconForFolder,
  getIconForOpenFolder,
} from "vscode-icons-js";

export interface TreeNode {
  path: string;
  type: "blob" | "tree";
}

interface FileTreeProps {
  data: TreeNode[];
  activePath: string | null;
  onFileClick: (path: string) => void;
}

// CDN chính thức của vscode-icons (chứa toàn bộ SVG màu của VS Code)
const ICON_BASE_URL =
  "https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons";

function FileOrFolderIcon({
  name,
  isFolder,
  isOpen,
}: {
  name: string;
  isFolder: boolean;
  isOpen?: boolean;
}) {
  let iconName: string | undefined;

  if (isFolder) {
    iconName = isOpen ? getIconForOpenFolder(name) : getIconForFolder(name);
    // Fallback nếu thư mục không có icon riêng (như src, components...)
    if (!iconName)
      iconName = isOpen ? "default_folder_opened.svg" : "default_folder.svg";
  } else {
    iconName = getIconForFile(name);
    // Fallback cho file lạ
    if (!iconName) iconName = "default_file.svg";
  }

  return (
    <img
      src={`${ICON_BASE_URL}/${iconName}`}
      alt={name}
      width={16}
      height={16}
      loading="lazy"
      style={{ display: "block", flexShrink: 0, objectFit: "contain" }}
      onError={(e) => {
        // Dự phòng khi gặp file mới mà repo CDN chưa kịp cập nhật
        (e.target as HTMLImageElement).src =
          `${ICON_BASE_URL}/${isFolder ? "default_folder.svg" : "default_file.svg"}`;
      }}
    />
  );
}

function buildTree(flatData: TreeNode[]) {
  const root: any = { children: {} };
  flatData.forEach((item) => {
    const parts = item.path.split("/");
    let current = root;
    parts.forEach((part, index) => {
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: parts.slice(0, index + 1).join("/"),
          type: index === parts.length - 1 ? item.type : "tree",
          children: {},
        };
      }
      current = current.children[part];
    });
  });

  const sortNodes = (node: any) => {
    const childrenArray = Object.values(node.children);
    // Ưu tiên đưa Thư mục lên trước, File ra sau; sắp xếp theo thứ tự chữ cái A-Z
    childrenArray.sort((a: any, b: any) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === "tree" ? -1 : 1;
    });
    node.children = childrenArray;
    node.children.forEach((child: any) => sortNodes(child));
    return childrenArray;
  };
  return sortNodes(root);
}

const TreeItem = memo(function TreeItem({
  node,
  depth,
  activePath,
  onFileClick,
}: {
  node: any;
  depth: number;
  activePath: string | null;
  onFileClick: (p: string) => void;
}) {
  const isFolder = node.type === "tree";
  const isActive = activePath === node.path;
  const isAncestorOfActive = Boolean(
    activePath && activePath.startsWith(node.path + "/"),
  );

  const [isOpen, setIsOpen] = useState(isAncestorOfActive);

  // Tự động mở rộng các thư mục cha chứa file đang được chọn
  useEffect(() => {
    if (isAncestorOfActive) {
      setIsOpen(true);
    }
  }, [isAncestorOfActive]);

  return (
    <Box style={{ width: "100%", minWidth: "max-content" }}>
      <UnstyledButton
        onClick={() => (isFolder ? setIsOpen(!isOpen) : onFileClick(node.path))}
        title={node.path}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          minWidth: "max-content",
          padding: "3px 8px 3px 6px",
          backgroundColor: isActive ? "#fef2f2" : "transparent",
          borderLeft: isActive
            ? "2.5px solid #dc2626"
            : "2.5px solid transparent",
          borderRadius: isActive ? "0 4px 4px 0" : "0",
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          if (!isActive)
            e.currentTarget.style.backgroundColor = "rgba(244, 244, 245, 0.9)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {/* Mũi tên đóng/mở thư mục hoặc spacer cho file */}
          {isFolder ? (
            <Box
              w={14}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isOpen ? (
                <IconChevronDown size={12} color="#71717a" />
              ) : (
                <IconChevronRight size={12} color="#71717a" />
              )}
            </Box>
          ) : (
            <Box w={14} style={{ flexShrink: 0 }} />
          )}

          {/* Icon file/folder màu chính hãng VS Code */}
          <FileOrFolderIcon
            name={node.name}
            isFolder={isFolder}
            isOpen={isOpen}
          />

          {/* Tên file */}
          <Text
            fz={13}
            ff="monospace"
            c={isActive ? "#b91c1c" : isFolder ? "#27272a" : "#3f3f46"}
            fw={isActive ? 600 : isFolder ? 500 : 400}
            style={{ whiteSpace: "nowrap" }}
          >
            {node.name}
          </Text>
        </Group>
      </UnstyledButton>

      {/* Thư mục con: Thụt lề chuẩn 12px và vẽ đường kẻ gióng thanh mảnh */}
      {isFolder && (
        <Collapse expanded={isOpen}>
          <Box
            style={{
              borderLeft: "1px solid #e4e4e7",
              marginLeft: 12,
              paddingLeft: 2,
            }}
          >
            {node.children.map((child: any) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                activePath={activePath}
                onFileClick={onFileClick}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
});

export const FileTree = memo(function FileTree({
  data,
  activePath,
  onFileClick,
}: FileTreeProps) {
  const tree = useMemo(() => buildTree(data), [data]);
  return (
    <Box py={2} style={{ width: "max-content", minWidth: "100%" }}>
      {tree.map((node: any) => (
        <TreeItem
          key={node.path}
          node={node}
          depth={0}
          activePath={activePath}
          onFileClick={onFileClick}
        />
      ))}
    </Box>
  );
});
