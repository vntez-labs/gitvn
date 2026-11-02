"use client";

import { Box, Collapse, Group, Text, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";
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

function TreeItem({
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
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === "tree";
  const isActive = activePath === node.path;

  return (
    <Box>
      <UnstyledButton
        onClick={() => (isFolder ? setIsOpen(!isOpen) : onFileClick(node.path))}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "4px 8px",
          paddingLeft: depth * 12 + 6,
          backgroundColor: isActive ? "rgba(37, 99, 235, 0.1)" : "transparent",
          borderLeft: isActive ? "2px solid #2563eb" : "2px solid transparent",
          transition: "background 0.1s ease",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "#f1f5f9";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <Group gap={6} wrap="nowrap" style={{ overflow: "hidden" }}>
          {/* Mũi tên đóng/mở thư mục */}
          <Box
            w={12}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isFolder &&
              (isOpen ? (
                <IconChevronDown size={12} color="#64748b" />
              ) : (
                <IconChevronRight size={12} color="#64748b" />
              ))}
          </Box>

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
            c={isActive ? "#1d4ed8" : isFolder ? "#0f172a" : "#475569"}
            fw={isActive ? 600 : 400}
            truncate
          >
            {node.name}
          </Text>
        </Group>
      </UnstyledButton>

      {/* Đường kẻ gióng lùi dòng khi mở thư mục */}
      {isFolder && (
        <Collapse expanded={isOpen}>
          <Box
            style={{
              borderLeft: "1px solid #e2e8f0",
              marginLeft: depth * 12 + 11,
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
}

export function FileTree({ data, activePath, onFileClick }: FileTreeProps) {
  const tree = buildTree(data);
  return (
    <Box py={2}>
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
}
