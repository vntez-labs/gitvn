"use client";

import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowRight,
  IconCheck,
  IconGitBranch,
  IconGitPullRequest,
} from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";

interface CreatePullModalProps {
  opened: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  defaultBase?: string;
  defaultHead?: string;
  onSuccess?: (prNumber: number) => void;
}

export function CreatePullModal({
  opened,
  onClose,
  owner,
  repo,
  defaultBase = "main",
  defaultHead,
  onSuccess,
}: CreatePullModalProps) {
  const [branches, setBranches] = useState<string[]>([]);
  const [baseBranch, setBaseBranch] = useState(defaultBase);
  const [headBranch, setHeadBranch] = useState(defaultHead || "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Lấy danh sách branches
  useEffect(() => {
    if (!opened) return;
    axios
      .get(`/api/github/branches?owner=${owner}&repo=${repo}`)
      .then((res) => {
        const names = (res.data?.branches || []).map((b: any) => b.name);
        setBranches(names);
        if (!baseBranch && names.includes("main")) setBaseBranch("main");
        if (defaultHead && names.includes(defaultHead))
          setHeadBranch(defaultHead);
        else if (!headBranch && names.length > 1) {
          const nonBase = names.find(
            (n: string) => n !== (defaultBase || "main"),
          );
          if (nonBase) setHeadBranch(nonBase);
        }
      })
      .catch((err) => console.error("Lỗi lấy branches:", err));
  }, [opened, owner, repo, defaultBase, defaultHead]);

  // So sánh giữa base và head branch
  useEffect(() => {
    if (!opened || !baseBranch || !headBranch || baseBranch === headBranch) {
      setCompareData(null);
      return;
    }

    setLoadingCompare(true);
    axios
      .get(
        `/api/github/compare?owner=${owner}&repo=${repo}&base=${encodeURIComponent(
          baseBranch,
        )}&head=${encodeURIComponent(headBranch)}`,
      )
      .then((res) => {
        setCompareData(res.data);
        if (!title && res.data?.ahead_by > 0) {
          setTitle(`Merge ${headBranch} into ${baseBranch}`);
        }
      })
      .catch(() => setCompareData(null))
      .finally(() => setLoadingCompare(false));
  }, [opened, owner, repo, baseBranch, headBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !headBranch || !baseBranch) {
      setErrorMsg("Vui lòng điền đầy đủ tiêu đề và nhánh cần merge.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await axios.post("/api/github/pulls", {
        owner,
        repo,
        title: title.trim(),
        base: baseBranch,
        head: headBranch,
        body: body.trim(),
        draft: isDraft,
      });

      if (res.data?.success) {
        const newPr = res.data.pull;
        notifications.show({
          title: `Tạo Pull Request #${newPr.number} thành công!`,
          message: newPr.title,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        onClose();
        if (onSuccess) {
          onSuccess(newPr.number);
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          "Có lỗi xảy ra khi tạo Pull Request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconGitPullRequest size={18} color="#16a34a" />
          <Text fw={700} fz={15} c="#1f1c19">
            Tạo Pull Request mới
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      centered
      styles={{
        content: { backgroundColor: "#ffffff" },
        header: { borderBottom: "1px solid #e8e5de" },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          {/* Nhánh base <- head */}
          <Box
            p="sm"
            style={{
              backgroundColor: "#f5f3ee",
              borderRadius: 8,
              border: "1px solid #e8e5de",
            }}
          >
            <Group justify="space-between" align="center" gap="sm">
              <Box style={{ flex: 1 }}>
                <Text fz={11} fw={600} c="#6e675f" mb={4}>
                  NHÁNH ĐÍCH (BASE)
                </Text>
                <Select
                  data={branches}
                  value={baseBranch}
                  onChange={(val) => setBaseBranch(val || "main")}
                  size="xs"
                  searchable
                  leftSection={<IconGitBranch size={13} />}
                />
              </Box>

              <IconArrowRight
                size={18}
                color="#94a3b8"
                style={{ marginTop: 14 }}
              />

              <Box style={{ flex: 1 }}>
                <Text fz={11} fw={600} c="#6e675f" mb={4}>
                  NHÁNH SO SÁNH (COMPARE / HEAD)
                </Text>
                <Select
                  data={branches}
                  value={headBranch}
                  onChange={(val) => setHeadBranch(val || "")}
                  size="xs"
                  searchable
                  leftSection={<IconGitBranch size={13} />}
                />
              </Box>
            </Group>

            {/* Thông tin compare */}
            {compareData && (
              <Group gap="xs" mt="xs">
                {compareData.ahead_by > 0 ? (
                  <Badge size="xs" color="green" variant="filled">
                    Có {compareData.ahead_by} commit mới để merge
                  </Badge>
                ) : (
                  <Badge size="xs" color="gray" variant="light">
                    Hai nhánh giống nhau (0 commit ahead)
                  </Badge>
                )}
                {compareData.behind_by > 0 && (
                  <Badge size="xs" color="yellow" variant="light">
                    Đang sau {compareData.behind_by} commit
                  </Badge>
                )}
              </Group>
            )}
          </Box>

          {errorMsg && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              variant="light"
              title="Không thể tạo PR"
            >
              {errorMsg}
            </Alert>
          )}

          <TextInput
            label="Tiêu đề Pull Request"
            placeholder="vd: feat(auth): Thêm tính năng đăng nhập GitHub"
            required
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />

          <Textarea
            label="Mô tả chi tiết (Tùy chọn, hỗ trợ Markdown)"
            placeholder="Mô tả các thay đổi, giải pháp và cách kiểm thử..."
            minRows={4}
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
          />

          <Checkbox
            label="Tạo dưới dạng bản nháp (Draft Pull Request)"
            description="Bản nháp thông báo với mọi người rằng công việc vẫn đang được xử lý và chưa sẵn sàng để review."
            checked={isDraft}
            onChange={(e) => setIsDraft(e.currentTarget.checked)}
          />

          <Group justify="flex-end" gap="sm" mt="sm">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              color="green"
              loading={submitting}
              leftSection={<IconGitPullRequest size={15} />}
            >
              Tạo Pull Request
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
