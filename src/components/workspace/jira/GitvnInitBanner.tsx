"use client";

import { Box, Button, Paper, Text } from "@mantine/core";
import { IconFolderPlus, IconSparkles } from "@tabler/icons-react";

interface GitvnInitBannerProps {
  initializing: boolean;
  onInitialize: () => void;
}

export function GitvnInitBanner({
  initializing,
  onInitialize,
}: GitvnInitBannerProps) {
  return (
    <Box
      p="xl"
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <Paper
        p={40}
        radius="md"
        ta="center"
        maw={560}
        bg="#ffffff"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <Box
          w={64}
          h={64}
          mx="auto"
          mb="md"
          style={{
            borderRadius: 16,
            backgroundColor: "#fff1f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fb291a",
          }}
        >
          <IconFolderPlus size={32} />
        </Box>
        <Text fz={18} fw={700} c="#0f172a" mb="xs">
          Chưa phát hiện cấu hình .gitvn trong repository
        </Text>
        <Text fz="sm" c="#64748b" mb="xl" lh={1.6}>
          GitVN quản lý Agile Sprint, Kanban board và tài liệu chuẩn hoá thông
          qua thư mục <code>.gitvn/</code> lưu trực tiếp trong mã nguồn của bạn.
        </Text>
        <Button
          size="md"
          variant="filled"
          color="vntez"
          loading={initializing}
          leftSection={<IconSparkles size={18} />}
          onClick={onInitialize}
          style={{ fontWeight: 600 }}
        >
          Khởi tạo .gitvn và Bảng Kanban
        </Button>
      </Paper>
    </Box>
  );
}
