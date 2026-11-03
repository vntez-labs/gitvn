"use client";

import { Box, Button, Divider, Group, Paper, Stack, Text } from "@mantine/core";

interface DangerZoneSectionProps {
  isPrivate: boolean;
  isArchived: boolean;
  onOpenVisibilityModal: () => void;
  onOpenArchiveModal: () => void;
  onOpenDeleteModal: () => void;
}

export function DangerZoneSection({
  isPrivate,
  isArchived,
  onOpenVisibilityModal,
  onOpenArchiveModal,
  onOpenDeleteModal,
}: DangerZoneSectionProps) {
  return (
    <>
      <Box mb="md">
        <Text fz={18} fw={700} c="#dc2626">
          Danger Zone
        </Text>
        <Text fz="xs" c="#64748b" mt={2}>
          Các hành động có rủi ro cao hoặc không thể hoàn tác
        </Text>
      </Box>

      <Paper
        p="lg"
        radius="md"
        bg="#ffffff"
        style={{
          border: "1px solid #fecaca",
          boxShadow: "0 1px 3px rgba(220, 38, 38, 0.05)",
        }}
        mb="xl"
      >
        <Stack gap="lg">
          {/* Change Visibility */}
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Box>
              <Text fz="sm" fw={600} c="#0f172a">
                Change repository visibility
              </Text>
              <Text fz="xs" c="#64748b">
                Hiện tại repository đang là{" "}
                <strong>{isPrivate ? "Private" : "Public"}</strong>.
              </Text>
            </Box>
            <Button
              variant="outline"
              color="red"
              size="xs"
              onClick={onOpenVisibilityModal}
            >
              Change to {isPrivate ? "Public" : "Private"}
            </Button>
          </Group>

          <Divider color="#fee2e2" />

          {/* Archive Repo */}
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Box>
              <Text fz="sm" fw={600} c="#0f172a">
                {isArchived
                  ? "Unarchive this repository"
                  : "Archive this repository"}
              </Text>
              <Text fz="xs" c="#64748b">
                Đánh dấu repository ở chế độ chỉ đọc (read-only) và không thể
                commit.
              </Text>
            </Box>
            <Button
              variant="outline"
              color="red"
              size="xs"
              disabled={isArchived}
              onClick={onOpenArchiveModal}
            >
              {isArchived ? "Archived" : "Archive this repository"}
            </Button>
          </Group>

          <Divider color="#fee2e2" />

          {/* Delete Repo */}
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Box>
              <Text fz="sm" fw={600} c="#dc2626">
                Delete this repository
              </Text>
              <Text fz="xs" c="#64748b">
                Xóa vĩnh viễn repository này cùng toàn bộ commits, branches và
                pull requests.
              </Text>
            </Box>
            <Button
              variant="filled"
              color="red"
              size="xs"
              onClick={onOpenDeleteModal}
            >
              Delete this repository
            </Button>
          </Group>
        </Stack>
      </Paper>
    </>
  );
}
