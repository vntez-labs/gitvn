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
import { IconCalendar, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import type { JiraSprint, SprintStatus } from "@/interfaces/jira";

interface CreateSprintModalProps {
  opened: boolean;
  onClose: () => void;
  sprintCount: number;
  onCreateSprint: (newSprint: JiraSprint) => void;
}

export function CreateSprintModal({
  opened,
  onClose,
  sprintCount,
  onCreateSprint,
}: CreateSprintModalProps) {
  const nextNum = sprintCount + 1;
  const today = new Date().toISOString().slice(0, 10);
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [name, setName] = useState(`Sprint ${nextNum}`);
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(twoWeeksLater);
  const [status, setStatus] = useState<SprintStatus>("planned");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newSprint: JiraSprint = {
      id: `sprint-${Date.now()}`,
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status,
      createdAt: new Date().toISOString(),
    };

    onCreateSprint(newSprint);
    setName(`Sprint ${nextNum + 1}`);
    setGoal("");
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconCalendar size={18} color="#fb291a" />
          <Text fw={700} fz={15} c="#0f172a">
            Tạo Sprint Mới
          </Text>
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
      <form onSubmit={handleSubmit}>
        <Stack gap="md" mt="xs">
          <TextInput
            label="Tên Sprint"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 4,
              },
            }}
          />

          <Textarea
            label="Mục tiêu Sprint (Sprint Goal)"
            placeholder="Mục tiêu cốt lõi cần đạt được trong chu kỳ này..."
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 4,
              },
            }}
          />

          <Group grow>
            <TextInput
              label="Ngày bắt đầu"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.currentTarget.value)}
              styles={{
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
                label: {
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 4,
                },
              }}
            />

            <TextInput
              label="Ngày kết thúc"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.currentTarget.value)}
              styles={{
                input: {
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                  color: "#0f172a",
                },
                label: {
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: 12,
                  marginBottom: 4,
                },
              }}
            />
          </Group>

          <Select
            label="Trạng thái ban đầu"
            data={[
              { value: "planned", label: "📅 Lên kế hoạch (Planned)" },
              { value: "active", label: "🚀 Đang chạy (Active)" },
            ]}
            value={status}
            onChange={(val) => setStatus((val as SprintStatus) || "planned")}
            styles={{
              input: {
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
              },
              label: {
                color: "#334155",
                fontWeight: 600,
                fontSize: 12,
                marginBottom: 4,
              },
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              color="vntez"
              leftSection={<IconPlus size={14} />}
            >
              Tạo Sprint
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
