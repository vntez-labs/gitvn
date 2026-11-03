"use client";

import {
  Alert,
  Box,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCheck,
  IconGitBranch,
  IconWorld,
} from "@tabler/icons-react";

interface GeneralSettingsSectionProps {
  repoName: string;
  setRepoName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  homepage: string;
  setHomepage: (val: string) => void;
  savingGeneral: boolean;
  onSaveGeneral: () => void;
  generalMessage: { type: "success" | "error"; text: string } | null;
  onCloseMessage: () => void;
  defaultBranch: string;
  setDefaultBranch: (val: string) => void;
  availableBranches: string[];
  savingBranch: boolean;
  onSaveDefaultBranch: () => void;
  originalDefaultBranch?: string;
}

export function GeneralSettingsSection({
  repoName,
  setRepoName,
  description,
  setDescription,
  homepage,
  setHomepage,
  savingGeneral,
  onSaveGeneral,
  generalMessage,
  onCloseMessage,
  defaultBranch,
  setDefaultBranch,
  availableBranches,
  savingBranch,
  onSaveDefaultBranch,
  originalDefaultBranch,
}: GeneralSettingsSectionProps) {
  return (
    <>
      {/* 1. GENERAL SETTINGS */}
      <Box mb="md">
        <Text fz={18} fw={700} c="#0f172a">
          General Settings
        </Text>
        <Text fz="xs" c="#64748b" mt={2}>
          Cấu hình tên, mô tả và website hiển thị của dự án
        </Text>
      </Box>

      {generalMessage && (
        <Alert
          color={generalMessage.type === "success" ? "green" : "red"}
          icon={
            generalMessage.type === "success" ? (
              <IconCheck size={16} />
            ) : (
              <IconAlertTriangle size={16} />
            )
          }
          mb="lg"
          withCloseButton
          onClose={onCloseMessage}
        >
          {generalMessage.text}
        </Alert>
      )}

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
        <Stack gap="md">
          <TextInput
            label="Repository name"
            value={repoName}
            onChange={(e) => setRepoName(e.currentTarget.value)}
            size="xs"
            styles={{
              label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
                fontFamily: "monospace",
              },
            }}
          />

          <Textarea
            label="Description"
            placeholder="Mô tả ngắn gọn về dự án..."
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            rows={3}
            size="xs"
            styles={{
              label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
            }}
          />

          <TextInput
            label="Website URL"
            placeholder="https://yourproject.com"
            value={homepage}
            onChange={(e) => setHomepage(e.currentTarget.value)}
            size="xs"
            leftSection={<IconWorld size={14} color="#64748b" />}
            styles={{
              label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
            }}
          />

          <Group justify="flex-end" mt="xs">
            <Button
              size="xs"
              color="indigo"
              loading={savingGeneral}
              onClick={onSaveGeneral}
              style={{ fontWeight: 600 }}
            >
              Lưu thay đổi
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* 2. DEFAULT BRANCH */}
      <Box mb="md">
        <Text fz={18} fw={700} c="#0f172a">
          Default Branch
        </Text>
        <Text fz="xs" c="#64748b" mt={2}>
          Nhánh mặc định cho các thao tác clone, commit và pull request
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
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Box style={{ flex: 1, minWidth: 260 }}>
            <Select
              label="Nhánh mặc định"
              data={availableBranches.map((b) => ({ value: b, label: b }))}
              value={defaultBranch}
              onChange={(val) => setDefaultBranch(val || "main")}
              size="xs"
              leftSection={<IconGitBranch size={14} color="#64748b" />}
              styles={{
                label: { color: "#334155", fontWeight: 600, marginBottom: 6 },
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                  fontFamily: "monospace",
                },
              }}
            />
          </Box>

          <Button
            size="xs"
            variant="default"
            loading={savingBranch}
            onClick={onSaveDefaultBranch}
            disabled={defaultBranch === originalDefaultBranch}
          >
            Cập nhật nhánh mặc định
          </Button>
        </Group>
      </Paper>
    </>
  );
}
