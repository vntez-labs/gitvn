"use client";

import { Box, Divider, Group, Paper, Stack, Switch, Text } from "@mantine/core";

interface FeaturesState {
  has_issues: boolean;
  has_wiki: boolean;
  has_projects: boolean;
  allow_squash_merge: boolean;
  allow_merge_commit: boolean;
  allow_rebase_merge: boolean;
  delete_branch_on_merge: boolean;
}

interface FeaturesSettingsSectionProps {
  features: FeaturesState;
  onToggleFeature: (key: keyof FeaturesState, value: boolean) => void;
}

export function FeaturesSettingsSection({
  features,
  onToggleFeature,
}: FeaturesSettingsSectionProps) {
  return (
    <>
      <Box mb="md">
        <Text fz={18} fw={700} c="#0f172a">
          Features & Pull Requests
        </Text>
        <Text fz="xs" c="#64748b" mt={2}>
          Bật/tắt các tính năng bổ sung và chiến lược hợp nhất PR
        </Text>
      </Box>

      <Paper
        p="lg"
        radius="md"
        bg="#ffffff"
        style={{
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
        mb="xl"
      >
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <Box>
              <Text fz="sm" fw={600} c="#0f172a">
                Issues
              </Text>
              <Text fz="xs" c="#64748b">
                Theo dõi lỗi và yêu cầu công việc
              </Text>
            </Box>
            <Switch
              checked={features.has_issues}
              onChange={(e) =>
                onToggleFeature("has_issues", e.currentTarget.checked)
              }
              color="indigo"
            />
          </Group>

          <Divider color="#e2e8f0" />

          <Group justify="space-between" align="center">
            <Box>
              <Text fz="sm" fw={600} c="#0f172a">
                Allow squash merging
              </Text>
              <Text fz="xs" c="#64748b">
                Gộp toàn bộ commit của PR thành một commit duy nhất khi merge
              </Text>
            </Box>
            <Switch
              checked={features.allow_squash_merge}
              onChange={(e) =>
                onToggleFeature("allow_squash_merge", e.currentTarget.checked)
              }
              color="indigo"
            />
          </Group>

          <Divider color="#e2e8f0" />

          <Group justify="space-between" align="center">
            <Box>
              <Text fz="sm" fw={600} c="#0f172a">
                Automatically delete head branches
              </Text>
              <Text fz="xs" c="#64748b">
                Tự động xóa nhánh nguồn sau khi PR được merge thành công
              </Text>
            </Box>
            <Switch
              checked={features.delete_branch_on_merge}
              onChange={(e) =>
                onToggleFeature(
                  "delete_branch_on_merge",
                  e.currentTarget.checked,
                )
              }
              color="indigo"
            />
          </Group>
        </Stack>
      </Paper>
    </>
  );
}
