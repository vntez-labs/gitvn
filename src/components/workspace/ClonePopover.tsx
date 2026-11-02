"use client";

import {
  ActionIcon,
  Button,
  CopyButton,
  Divider,
  Popover,
  SegmentedControl,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconDownload,
  IconTerminal2,
} from "@tabler/icons-react";
import { useState } from "react";
import { useDashboardStore } from "@/store/dashboard.store";

export function ClonePopover() {
  const { selectedRepo, currentBranch } = useDashboardStore();
  const [protocol, setProtocol] = useState<"https" | "ssh">("https");

  if (!selectedRepo) return null;

  const httpsUrl =
    selectedRepo.clone_url ||
    `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}.git`;
  const sshUrl = `git@github.com:${selectedRepo.owner.login}/${selectedRepo.name}.git`;
  const zipUrl = `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/archive/refs/heads/${currentBranch}.zip`;
  const cloneTarget = protocol === "https" ? httpsUrl : sshUrl;

  return (
    <Popover width={340} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<IconTerminal2 size={13} color="#fb291a" />}
          rightSection={<IconChevronDown size={11} />}
          styles={{
            root: {
              backgroundColor: "#ffffff",
              borderColor: "#e5e1da",
              color: "#1f1c19",
              fontWeight: 500,
            },
          }}
        >
          Code
        </Button>
      </Popover.Target>

      <Popover.Dropdown
        bg="#ffffff"
        style={{ borderColor: "#e2e8f0", padding: 14 }}
      >
        <Text fz={12} fw={700} c="#0f172a" mb={8}>
          Clone repository ({currentBranch})
        </Text>

        <SegmentedControl
          value={protocol}
          onChange={(val) => setProtocol(val as "https" | "ssh")}
          size="xs"
          fullWidth
          data={[
            { label: "HTTPS", value: "https" },
            { label: "SSH", value: "ssh" },
          ]}
          styles={{
            root: { backgroundColor: "#f1f5f9" },
            indicator: {
              backgroundColor: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            },
            label: { color: "#334155", fontSize: 11, fontWeight: 600 },
          }}
          mb="xs"
        />

        <TextInput
          value={cloneTarget}
          readOnly
          size="xs"
          styles={{
            input: {
              backgroundColor: "#f8fafc",
              borderColor: "#cbd5e1",
              color: "#0f172a",
              fontFamily: "monospace",
              fontSize: 11,
            },
          }}
          rightSection={
            <CopyButton value={cloneTarget}>
              {({ copied, copy }) => (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color={copied ? "teal" : "gray"}
                  onClick={copy}
                >
                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </ActionIcon>
              )}
            </CopyButton>
          }
          mb="sm"
        />

        <Divider color="#e2e8f0" my="xs" />

        <Button
          component="a"
          href={zipUrl}
          download
          variant="subtle"
          color="gray"
          size="xs"
          fullWidth
          leftSection={<IconDownload size={14} />}
          styles={{
            root: {
              justifyContent: "flex-start",
              color: "#334155",
              fontSize: 12,
              "&:hover": { backgroundColor: "#f1f5f9" },
            },
          }}
        >
          Tải file ZIP ({currentBranch})
        </Button>
      </Popover.Dropdown>
    </Popover>
  );
}
