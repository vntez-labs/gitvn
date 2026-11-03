"use client";

import {
  Alert,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Modal,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconFileCode,
  IconFiles,
  IconGitBranch,
  IconSparkles,
} from "@tabler/icons-react";
import axios from "axios";
import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";

interface UpgradeGitvnModalProps {
  opened: boolean;
  onClose: () => void;
  currentVersion?: string;
  reason?: string;
  onUpgraded?: () => void;
}

export function UpgradeGitvnModal({
  opened,
  onClose,
  currentVersion = "1.0.0",
  reason,
  onUpgraded,
}: UpgradeGitvnModalProps) {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedRepo) return;
    setUpgrading(true);

    try {
      const res = await axios.post("/api/gitvn", {
        action: "upgrade",
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        branch: currentBranch,
      });

      if (res.data.success) {
        notifications.show({
          title: "Nâng cấp v2.0 thành công!",
          message:
            res.data.message ||
            `Đã tách ${res.data.migratedTasksCount || 0} task sang file rời .gitvn/tasks/*.md và tạo config.yml`,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        onUpgraded?.();
        onClose();
      }
    } catch (err: any) {
      notifications.show({
        title: "Nâng cấp thất bại",
        message: err.response?.data?.error || err.message,
        color: "red",
      });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" color="red" variant="light">
            <IconSparkles size={16} />
          </ThemeIcon>
          <Box>
            <Text fw={700} fz={15} c="#18181b">
              Nâng cấp Quy chuẩn .gitvn lên v2.0
            </Text>
            <Text fz={12} c="#71717a">
              Chống xung đột Git (Merge Conflicts) & Tối ưu AI Coding Agents
            </Text>
          </Box>
        </Group>
      }
      size="lg"
      centered
      radius="md"
      padding="lg"
    >
      <Stack gap="md">
        {reason && (
          <Alert
            icon={<IconAlertTriangle size={16} />}
            color="orange"
            variant="light"
            radius="md"
            title="Phát hiện quy chuẩn chưa đồng bộ"
          >
            <Text fz={12}>{reason}</Text>
          </Alert>
        )}

        {/* So sánh v1 vs v2 */}
        <Group grow align="stretch" gap="sm">
          {/* Card v1 */}
          <Box
            p="sm"
            style={{
              borderRadius: 8,
              border: "1px solid #e4e4e7",
              backgroundColor: "#fafafa",
            }}
          >
            <Group justify="space-between" mb={6}>
              <Text fw={600} fz={13} c="#71717a">
                Quy chuẩn cũ
              </Text>
              <Badge size="xs" color="gray" variant="light">
                v{currentVersion}
              </Badge>
            </Group>
            <Stack gap={6}>
              <Text fz={12} c="#52525b">
                • 1 file gom chung{" "}
                <Text component="span" ff="monospace" fw={600}>
                  tasks.json
                </Text>
              </Text>
              <Text fz={12} c="#dc2626">
                • Dễ conflict JSON khi nhiều nhánh cùng sửa task
              </Text>
              <Text fz={12} c="#71717a">
                • Chưa có cấu hình YAML chuẩn hoá
              </Text>
            </Stack>
          </Box>

          {/* Card v2 */}
          <Box
            p="sm"
            style={{
              borderRadius: 8,
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
            }}
          >
            <Group justify="space-between" mb={6}>
              <Text fw={600} fz={13} c="#dc2626">
                Quy chuẩn mới v2.0
              </Text>
              <Badge size="xs" color="red" variant="filled">
                Khuyên dùng
              </Badge>
            </Group>
            <Stack gap={6}>
              <Text fz={12} c="#991b1b">
                • File rời{" "}
                <Text component="span" ff="monospace" fw={600}>
                  .gitvn/tasks/*.md
                </Text>
              </Text>
              <Text fz={12} c="#166534">
                • Chống xung đột Git 100% khi merge nhánh
              </Text>
              <Text fz={12} c="#991b1b">
                • Chuẩn hoá{" "}
                <Text component="span" ff="monospace" fw={600}>
                  .gitvn/config.yml
                </Text>
              </Text>
            </Stack>
          </Box>
        </Group>

        <Divider label="Hành động nâng cấp tự động" labelPosition="center" />

        {/* Danh sách hành động tự động */}
        <Stack gap={8}>
          <Group gap="xs" wrap="nowrap">
            <IconFiles size={15} color="#dc2626" />
            <Text fz={12} c="#3f3f46">
              Chuyển đổi toàn bộ tasks sang định dạng Markdown + YAML
              Frontmatter trong thư mục{" "}
              <Text component="span" ff="monospace" fw={600}>
                .gitvn/tasks/
              </Text>
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <IconFileCode size={15} color="#dc2626" />
            <Text fz={12} c="#3f3f46">
              Tạo file cấu hình{" "}
              <Text component="span" ff="monospace" fw={600}>
                .gitvn/config.yml
              </Text>{" "}
              với storage format: &quot;decoupled&quot;
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <IconGitBranch size={15} color="#dc2626" />
            <Text fz={12} c="#3f3f46">
              Cập nhật tài liệu AI SSOT và commit trực tiếp lên branch{" "}
              <Text component="span" ff="monospace" fw={600}>
                {currentBranch}
              </Text>
            </Text>
          </Group>
        </Stack>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button
            variant="default"
            size="sm"
            onClick={onClose}
            disabled={upgrading}
            style={{ borderRadius: 8 }}
          >
            Để sau
          </Button>
          <Button
            color="red"
            size="sm"
            loading={upgrading}
            onClick={handleUpgrade}
            leftSection={<IconArrowRight size={15} />}
            style={{
              backgroundColor: "#dc2626",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Nâng cấp & Đồng bộ v2 ngay
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
