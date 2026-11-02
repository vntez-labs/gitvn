"use client";

import { Badge, Group, Modal, Tabs, Text } from "@mantine/core";
import { IconDownload, IconFileCode, IconUpload } from "@tabler/icons-react";
import { useState } from "react";
import type { GitvnDocItem } from "@/interfaces/gitvn";
import { DocsExportTab } from "./json/DocsExportTab";
import { DocsImportTab } from "./json/DocsImportTab";

interface DocsImportExportModalProps {
  opened: boolean;
  onClose: () => void;
  docs: GitvnDocItem[];
  owner: string;
  repo: string;
  branch: string;
  onDocsUpdated: () => void;
}

export function DocsImportExportModal({
  opened,
  onClose,
  docs,
  owner,
  repo,
  branch,
  onDocsUpdated,
}: DocsImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<string | null>("export");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        <Group gap="xs">
          <IconFileCode size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#1e293b">
            Import / Export Tài Liệu .gitvn/docs
          </Text>
          <Badge size="xs" variant="light" color="vntez">
            {docs.length} tài liệu
          </Badge>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          borderRadius: 12,
        },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "14px 20px",
        },
      }}
    >
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        color="vntez"
        radius="sm"
      >
        <Tabs.List mb="xs">
          <Tabs.Tab value="export" leftSection={<IconDownload size={14} />}>
            Export Docs JSON (Xuất tài liệu)
          </Tabs.Tab>
          <Tabs.Tab value="import" leftSection={<IconUpload size={14} />}>
            Import Docs JSON (Nhập tài liệu)
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="export">
          <DocsExportTab docs={docs} repo={repo} />
        </Tabs.Panel>

        <Tabs.Panel value="import">
          <DocsImportTab
            owner={owner}
            repo={repo}
            branch={branch}
            onDocsUpdated={onDocsUpdated}
            onClose={onClose}
          />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}
