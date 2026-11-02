'use client';

import MarkdownPreview from '@uiw/react-markdown-preview';
import { Box } from '@mantine/core';

export function MarkdownViewer({ content }: { content: string }) {
  return (
    <Box style={{ width: '100%' }}>
      <MarkdownPreview
        source={content}
        style={{ backgroundColor: 'transparent', color: '#d4d4d8' }}
        wrapperElement={{
          "data-color-mode": "dark" // Tự động nhận dark mode
        }}
      />
    </Box>
  );
}
