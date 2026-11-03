"use client";

import { Badge, Button, Group } from "@mantine/core";
import { IconCheck, IconRefresh, IconSparkles } from "@tabler/icons-react";

interface GitvnStatusBadgeProps {
  hasGitvn: boolean;
  isOutdated?: boolean;
  gitvnVersion?: string;
  onOpenUpgradeModal?: () => void;
  onInitializeGitvn?: () => void;
  initializingGitvn?: boolean;
}

export function GitvnStatusBadge({
  hasGitvn,
  isOutdated,
  gitvnVersion,
  onOpenUpgradeModal,
  onInitializeGitvn,
  initializingGitvn,
}: GitvnStatusBadgeProps) {
  if (!hasGitvn) {
    if (!onInitializeGitvn) return null;
    return (
      <Button
        size="compact-xs"
        variant="subtle"
        color="red"
        loading={initializingGitvn}
        onClick={onInitializeGitvn}
        leftSection={<IconSparkles size={12} />}
        style={{
          backgroundColor: "#fef2f2",
          color: "#b91c1c",
          borderColor: "#fecaca",
          borderRadius: 6,
          fontWeight: 500,
        }}
      >
        Khởi tạo .gitvn
      </Button>
    );
  }

  if (isOutdated) {
    return (
      <Group gap={4} wrap="nowrap">
        <Badge
          size="xs"
          variant="outline"
          onClick={onOpenUpgradeModal}
          style={{
            backgroundColor: "#fffbeb",
            color: "#b45309",
            borderColor: "#fde68a",
            borderRadius: 9999,
            fontWeight: 500,
            padding: "2px 8px",
            cursor: "pointer",
          }}
        >
          ● .gitvn v{gitvnVersion || "1"} (Cần nâng cấp)
        </Badge>
        {onOpenUpgradeModal && (
          <Button
            size="compact-xs"
            variant="subtle"
            color="orange"
            onClick={onOpenUpgradeModal}
            leftSection={<IconRefresh size={12} />}
            style={{
              backgroundColor: "#fffbeb",
              color: "#b45309",
              borderColor: "#fde68a",
              borderRadius: 6,
              fontWeight: 500,
              height: 20,
              fontSize: 11,
            }}
          >
            Nâng cấp v2
          </Button>
        )}
      </Group>
    );
  }

  return (
    <Badge
      size="xs"
      variant="outline"
      leftSection={<IconCheck size={11} />}
      style={{
        backgroundColor: "#fef2f2",
        color: "#b91c1c",
        borderColor: "#fecaca",
        borderRadius: 9999,
        fontWeight: 500,
        padding: "2px 8px",
      }}
    >
      .gitvn v{gitvnVersion || "2"} Active
    </Badge>
  );
}
