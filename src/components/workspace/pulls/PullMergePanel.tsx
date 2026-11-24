"use client";

import {
  Alert,
  Button,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconExternalLink,
  IconGitMerge,
  IconRefresh,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  type MergeMethod,
  mergeMethods,
  type PullRequestDetails,
} from "@/lib/pull-request";

function getMergeState(pull: PullRequestDetails) {
  if (pull.merged)
    return { label: "Pull request đã được merge", color: "violet" };
  if (pull.state !== "open")
    return { label: "Pull request đã đóng", color: "gray" };
  if (pull.draft)
    return { label: "Pull request đang ở trạng thái Draft", color: "gray" };
  if (pull.mergeable === false || pull.mergeable_state === "dirty") {
    return { label: "Hai nhánh có xung đột", color: "red", conflict: true };
  }
  if (pull.mergeable === null || pull.mergeable_state === "unknown") {
    return { label: "GitHub đang tính khả năng merge", color: "yellow" };
  }
  switch (pull.mergeable_state) {
    case "clean":
      return { label: "Sẵn sàng merge", color: "green", canMerge: true };
    case "unstable":
      return {
        label: "Có checks đang chờ hoặc chưa đạt",
        color: "yellow",
        canMerge: true,
      };
    case "has_hooks":
      return {
        label: "GitHub sẽ kiểm tra điều kiện khi merge",
        color: "yellow",
        canMerge: true,
      };
    case "behind":
      return {
        label: "Nhánh nguồn cần cập nhật từ nhánh đích",
        color: "yellow",
        behind: true,
      };
    case "blocked":
      return { label: "Quy tắc của nhánh đang chặn merge", color: "yellow" };
    default:
      return { label: "Chưa xác định được trạng thái merge", color: "yellow" };
  }
}

interface Props {
  pull: PullRequestDetails;
  stale: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onMerge: (method: MergeMethod, sha: string) => Promise<void>;
}

export function PullMergePanel({
  pull,
  stale,
  refreshing,
  onRefresh,
  onMerge,
}: Props) {
  const [method, setMethod] = useState<MergeMethod>("merge");
  const [confirmedSha, setConfirmedSha] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = getMergeState(pull);
  const isOpen = pull.state === "open" && !pull.merged;
  const canMerge = state.canMerge && !stale;
  const headChanged = confirmedSha !== null && confirmedSha !== pull.head.sha;

  async function submitMerge() {
    if (!confirmedSha || !canMerge || headChanged) return;
    setMerging(true);
    setError(null);
    try {
      await onMerge(method, confirmedSha);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Merge thất bại.");
    } finally {
      setMerging(false);
      setConfirmedSha(null);
    }
  }

  return (
    <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
      <Group justify="space-between" align="center" p="md" bg="#f5f3ee">
        <Group gap="xs">
          <Text c={state.color} component="span" style={{ display: "flex" }}>
            <IconGitMerge size={20} />
          </Text>
          <Text fw={700} size="sm">
            {state.label}
          </Text>
        </Group>
        <Button
          variant="default"
          size="compact-sm"
          leftSection={<IconRefresh size={14} />}
          loading={refreshing}
          onClick={onRefresh}
        >
          Làm mới trạng thái
        </Button>
      </Group>
      <Stack gap="sm" p="md">
        <Text size="sm">
          <code>{pull.head.label}</code> → <code>{pull.base.label}</code>
        </Text>
        {error && <Alert color="red">{error}</Alert>}
        {isOpen && state.conflict && (
          <Group>
            <Button
              component="a"
              href={pull.html_url}
              target="_blank"
              rel="noreferrer"
              variant="light"
              color="orange"
              size="xs"
              rightSection={<IconExternalLink size={14} />}
            >
              Resolve conflicts trên GitHub
            </Button>
            <Text size="xs" c="dimmed">
              Sau khi sửa và commit phần xung đột, quay lại để kiểm tra trạng
              thái mới.
            </Text>
          </Group>
        )}
        {isOpen &&
          !state.conflict &&
          !state.canMerge &&
          pull.mergeable !== null && (
            <Button
              component="a"
              href={pull.html_url}
              target="_blank"
              rel="noreferrer"
              variant="default"
              size="xs"
              w="fit-content"
              rightSection={<IconExternalLink size={14} />}
            >
              {state.behind
                ? "Cập nhật nhánh trên GitHub"
                : "Xem điều kiện merge trên GitHub"}
            </Button>
          )}
        {isOpen && state.canMerge && (
          <Group align="end" gap="xs">
            <Select
              label="Cách merge"
              size="xs"
              value={method}
              allowDeselect={false}
              onChange={(value) => {
                if (
                  value === "merge" ||
                  value === "squash" ||
                  value === "rebase"
                )
                  setMethod(value);
              }}
              data={Object.entries(mergeMethods).map(([value, label]) => ({
                value,
                label,
              }))}
            />
            <Button
              color="green"
              size="xs"
              disabled={!canMerge}
              onClick={() => setConfirmedSha(pull.head.sha)}
            >
              Merge pull request
            </Button>
          </Group>
        )}
      </Stack>
      <Modal
        opened={confirmedSha !== null}
        onClose={() => {
          if (!merging) setConfirmedSha(null);
        }}
        title="Xác nhận merge"
        centered
        closeOnEscape={!merging}
        closeOnClickOutside={!merging}
        withCloseButton={!merging}
      >
        <Stack>
          <Text size="sm">
            {mergeMethods[method]} PR #{pull.number} vào{" "}
            <code>{pull.base.label}</code>.
          </Text>
          {headChanged && (
            <Alert color="yellow">
              Nhánh nguồn đã có commit mới. Hãy đóng hộp thoại và kiểm tra lại
              PR.
            </Alert>
          )}
          <Group justify="end">
            <Button
              variant="default"
              disabled={merging}
              onClick={() => setConfirmedSha(null)}
            >
              Hủy
            </Button>
            <Button
              color="green"
              loading={merging}
              disabled={!canMerge || headChanged}
              onClick={submitMerge}
            >
              Xác nhận merge
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
