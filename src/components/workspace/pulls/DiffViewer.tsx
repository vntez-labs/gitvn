'use client';

import { Box, Group, Text, Badge, Paper } from '@mantine/core';
import { IconFileText, IconPlus, IconMinus } from '@tabler/icons-react';
import { getIconForFile } from 'vscode-icons-js';

const ICON_BASE_URL = 'https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@master/icons';

interface FileDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export function DiffViewer({ file }: { file: FileDiff }) {
  const lines = (file.patch || '').split('\n');
  const iconName = getIconForFile(file.filename) || 'default_file.svg';

  return (
    <Paper radius="md" style={{ border: '1px solid #30363d', backgroundColor: '#0d1117', overflow: 'hidden' }}>
      {/* File Header */}
      <Box px="md" py={8} style={{ backgroundColor: '#161b22', borderBottom: '1px solid #30363d' }}>
        <Group justify="space-between">
          <Group gap="xs">
            <img
              src={`${ICON_BASE_URL}/${iconName}`}
              alt=""
              width={15}
              height={15}
              style={{ display: 'block', objectFit: 'contain' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${ICON_BASE_URL}/default_file.svg`;
              }}
            />
            <Text fz={13} fw={600} c="#f0f6fc" ff="monospace">
              {file.filename}
            </Text>
            <Badge
              size="xs"
              variant="outline"
              color={file.status === 'added' ? 'green' : file.status === 'removed' ? 'red' : 'gray'}
              styles={{ root: { textTransform: 'capitalize' } }}
            >
              {file.status}
            </Badge>
          </Group>

          <Group gap={8}>
            <Group gap={2} c="#3fb950">
              <IconPlus size={12} />
              <Text fz={11} fw={600}>
                {file.additions}
              </Text>
            </Group>
            <Group gap={2} c="#f85149">
              <IconMinus size={12} />
              <Text fz={11} fw={600}>
                {file.deletions}
              </Text>
            </Group>
          </Group>
        </Group>
      </Box>

      {/* Diff Lines View */}
      <Box style={{ overflowX: 'auto', fontFamily: 'monospace', fontSize: 12, lineHeight: '20px' }}>
        {lines.length > 0 && file.patch ? (
          lines.map((line, idx) => {
            const isAdd = line.startsWith('+') && !line.startsWith('+++');
            const isDel = line.startsWith('-') && !line.startsWith('---');
            const isHunkHeader = line.startsWith('@@');
            const isNoNewline = line.startsWith('\\');

            // Cắt bỏ dấu + hoặc - ở đầu; nếu là dòng context (bắt đầu bằng dấu cách) cũng cắt để lề thẳng hàng
            let content = line;
            if (isAdd || isDel) {
              content = line.slice(1);
            } else if (line.startsWith(' ')) {
              content = line.slice(1);
            }

            // Thiết lập màu sắc: Xanh (Thêm) / Đỏ (Bớt) kèm thanh viền trái
            let bg = 'transparent';
            let color = '#c9d1d9';
            let borderLeft = '3px solid transparent';

            if (isAdd) {
              bg = 'rgba(46, 160, 67, 0.15)';
              color = '#e6edf3';
              borderLeft = '3px solid #3fb950';
            } else if (isDel) {
              bg = 'rgba(248, 81, 73, 0.15)';
              color = '#e6edf3';
              borderLeft = '3px solid #f85149';
            } else if (isHunkHeader) {
              bg = 'rgba(56, 139, 253, 0.1)';
              color = '#79c0ff';
            } else if (isNoNewline) {
              color = '#8b949e';
            }

            return (
              <Box
                key={idx}
                px="md"
                style={{
                  backgroundColor: bg,
                  color,
                  borderLeft,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  minHeight: 20, // Giữ chiều cao cố định cho dòng trống
                }}
              >
                {content || '\u00A0'}
              </Box>
            );
          })
        ) : (
          <Box p="md" ta="center">
            <Text fz="xs" c="#8b949e">
              File nhị phân hoặc không có nội dung diff hiển thị.
            </Text>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
