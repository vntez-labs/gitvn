"use client";

import { Alert, Button, Modal, Stack, Text, TextInput } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

interface DangerZoneModalsProps {
  visibilityModalOpen: boolean;
  onCloseVisibilityModal: () => void;
  handleChangeVisibility: () => void;
  archiveModalOpen: boolean;
  onCloseArchiveModal: () => void;
  handleArchiveRepo: () => void;
  deleteModalOpen: boolean;
  onCloseDeleteModal: () => void;
  handleDeleteRepo: () => void;
  expectedConfirmText: string;
  confirmInput: string;
  setConfirmInput: (val: string) => void;
  actionLoading: boolean;
  actionError: string | null;
  isPrivate: boolean;
}

export function DangerZoneModals({
  visibilityModalOpen,
  onCloseVisibilityModal,
  handleChangeVisibility,
  archiveModalOpen,
  onCloseArchiveModal,
  handleArchiveRepo,
  deleteModalOpen,
  onCloseDeleteModal,
  handleDeleteRepo,
  expectedConfirmText,
  confirmInput,
  setConfirmInput,
  actionLoading,
  actionError,
  isPrivate,
}: DangerZoneModalsProps) {
  return (
    <>
      {/* MODAL 1: CHANGE VISIBILITY */}
      <Modal
        opened={visibilityModalOpen}
        onClose={onCloseVisibilityModal}
        title={
          <Text fw={700} c="#0f172a">
            Thay đổi quyền riêng tư repository
          </Text>
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
        <Stack gap="md">
          <Text fz="sm" c="#334155">
            Bạn sắp chuyển <strong>{expectedConfirmText}</strong> thành{" "}
            <strong>{isPrivate ? "Public" : "Private"}</strong>.
          </Text>
          <Text fz="xs" c="#64748b">
            Vui lòng nhập <code>{expectedConfirmText}</code> để xác nhận:
          </Text>
          <TextInput
            placeholder={expectedConfirmText}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.currentTarget.value)}
            styles={{ input: { fontFamily: "monospace" } }}
          />
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Button
            color="red"
            disabled={confirmInput !== expectedConfirmText}
            loading={actionLoading}
            onClick={handleChangeVisibility}
          >
            Tôi hiểu, hãy đổi sang {isPrivate ? "Public" : "Private"}
          </Button>
        </Stack>
      </Modal>

      {/* MODAL 2: ARCHIVE REPOSITORY */}
      <Modal
        opened={archiveModalOpen}
        onClose={onCloseArchiveModal}
        title={
          <Text fw={700} c="#0f172a">
            Lưu trữ (Archive) repository
          </Text>
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
        <Stack gap="md">
          <Text fz="sm" c="#334155">
            Sau khi lưu trữ, repository sẽ trở thành <strong>chỉ đọc</strong>.
            Bạn vẫn có thể clone nhưng không thể commit mã nguồn mới.
          </Text>
          <Text fz="xs" c="#64748b">
            Nhập <code>{expectedConfirmText}</code> để xác nhận:
          </Text>
          <TextInput
            placeholder={expectedConfirmText}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.currentTarget.value)}
            styles={{ input: { fontFamily: "monospace" } }}
          />
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Button
            color="red"
            disabled={confirmInput !== expectedConfirmText}
            loading={actionLoading}
            onClick={handleArchiveRepo}
          >
            Tôi hiểu, hãy lưu trữ repository này
          </Button>
        </Stack>
      </Modal>

      {/* MODAL 3: DELETE REPOSITORY */}
      <Modal
        opened={deleteModalOpen}
        onClose={onCloseDeleteModal}
        title={
          <Text fw={700} c="#dc2626">
            Xóa vĩnh viễn repository
          </Text>
        }
        centered
        radius="md"
        styles={{
          content: { backgroundColor: "#ffffff", border: "1px solid #fecaca" },
          header: {
            backgroundColor: "#fef2f2",
            borderBottom: "1px solid #fecaca",
          },
        }}
      >
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertTriangle size={16} />}>
            Hành động này <strong>KHÔNG THỂ</strong> hoàn tác. Toàn bộ mã nguồn,
            issues, pull requests và commits sẽ bị xóa vĩnh viễn khỏi GitHub!
          </Alert>
          <Text fz="xs" c="#64748b">
            Vui lòng nhập chính xác <code>{expectedConfirmText}</code> để xác
            nhận xóa:
          </Text>
          <TextInput
            placeholder={expectedConfirmText}
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.currentTarget.value)}
            styles={{ input: { fontFamily: "monospace" } }}
          />
          {actionError && <Alert color="red">{actionError}</Alert>}
          <Button
            color="red"
            disabled={confirmInput !== expectedConfirmText}
            loading={actionLoading}
            onClick={handleDeleteRepo}
          >
            Tôi hiểu rủi ro, hãy xóa repository này
          </Button>
        </Stack>
      </Modal>
    </>
  );
}
