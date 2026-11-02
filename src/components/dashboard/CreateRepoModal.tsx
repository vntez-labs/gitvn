"use client";

import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconBook, IconPlus } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useDashboardStore } from "@/store/dashboard.store";
import { RepoVisibilitySelector } from "./RepoVisibilitySelector";

interface CreateRepoModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateRepoModal({ opened, onClose }: CreateRepoModalProps) {
  const { user } = useAuthStore();
  const { orgs, selectedOrg, addRepo } = useDashboardStore();

  const [owner, setOwner] = useState<string>(selectedOrg || user?.login || "");
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Cập nhật owner mặc định khi modal mở hoặc selectedOrg thay đổi
  useEffect(() => {
    if (opened) {
      setOwner(selectedOrg || user?.login || "");
      setRepoName("");
      setDescription("");
      setIsPrivate(true);
      setNameError(null);
    }
  }, [opened, selectedOrg, user?.login]);

  const ownerOptions = useMemo(() => {
    const list = [
      ...(user
        ? [{ value: user.login, label: `${user.login} (Cá nhân)` }]
        : []),
      ...orgs.map((org) => ({
        value: org.login,
        label: `${org.login} (Organization)`,
      })),
    ];
    const seen = new Set<string>();
    return list.filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  }, [user, orgs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = repoName.trim();

    if (!cleanName) {
      setNameError("Vui lòng nhập tên repository");
      return;
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanName)) {
      setNameError(
        "Tên repo chỉ được chứa chữ cái, số, gạch ngang, gạch dưới và dấu chấm",
      );
      return;
    }

    setSubmitting(true);
    setNameError(null);

    try {
      const { data } = await axios.post("/api/github/repo", {
        name: cleanName,
        description: description.trim() || undefined,
        private: isPrivate,
        owner,
      });

      notifications.show({
        title: "Tạo thành công!",
        message: `Repository ${data.repo.full_name} đã sẵn sàng.`,
        color: "teal",
      });

      // Tự động thêm repo mới vào danh sách và chọn luôn để mở workspace
      addRepo(data.repo);
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Có lỗi xảy ra khi tạo repository";
      setNameError(msg);
      notifications.show({
        title: "Tạo repository thất bại",
        message: msg,
        color: "red",
      });
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
          <IconBook size={18} color="#fb291a" />
          <Text fw={600} fz={15} c="#0f172a">
            Tạo repository mới
          </Text>
        </Group>
      }
      centered
      radius="md"
      styles={{
        content: { backgroundColor: "#ffffff", border: "1px solid #e2e8f0" },
        header: {
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <Select
            label="Owner"
            data={ownerOptions}
            value={owner}
            onChange={(val) => setOwner(val || user?.login || "")}
            allowDeselect={false}
            styles={{
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              },
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
            }}
          />

          <TextInput
            label="Tên repository"
            placeholder="my-awesome-repo"
            required
            value={repoName}
            onChange={(e) => {
              setRepoName(e.currentTarget.value);
              if (nameError) setNameError(null);
            }}
            error={nameError}
            styles={{
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              },
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
                fontFamily: "monospace",
              },
            }}
          />

          <Textarea
            label="Mô tả (tùy chọn)"
            placeholder="Mô tả ngắn gọn về dự án..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            styles={{
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 4,
              },
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
            }}
          />

          <RepoVisibilitySelector
            isPrivate={isPrivate}
            setIsPrivate={setIsPrivate}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              color="vntez"
              loading={submitting}
              leftSection={<IconPlus size={16} />}
              style={{ fontWeight: 600 }}
            >
              Tạo repository
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
