"use client";

import { Box, Group, Paper, Radio, Stack, Text } from "@mantine/core";
import { IconLock, IconWorld } from "@tabler/icons-react";

interface RepoVisibilitySelectorProps {
  isPrivate: boolean;
  setIsPrivate: (val: boolean) => void;
}

export function RepoVisibilitySelector({
  isPrivate,
  setIsPrivate,
}: RepoVisibilitySelectorProps) {
  return (
    <Radio.Group
      value={isPrivate ? "private" : "public"}
      onChange={(val) => setIsPrivate(val === "private")}
      label="Quyền riêng tư"
      styles={{
        label: {
          color: "#334155",
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 6,
        },
      }}
    >
      <Stack gap="xs" mt={4}>
        <Paper
          p="sm"
          radius="sm"
          bg={!isPrivate ? "#fff1f0" : "#ffffff"}
          style={{
            border: `1px solid ${!isPrivate ? "#fb291a" : "#e2e8f0"}`,
            cursor: "pointer",
          }}
          onClick={() => setIsPrivate(false)}
        >
          <Radio
            value="public"
            color="vntez"
            label={
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <IconWorld
                  size={18}
                  color="#fb291a"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Box>
                  <Text fz={13} fw={600} c="#0f172a">
                    Public
                  </Text>
                  <Text fz={12} c="#64748b">
                    Bất kỳ ai trên internet đều có thể nhìn thấy repository này.
                    Bạn vẫn toàn quyền kiểm soát người commit.
                  </Text>
                </Box>
              </Group>
            }
          />
        </Paper>

        <Paper
          p="sm"
          radius="sm"
          bg={isPrivate ? "#fff1f0" : "#ffffff"}
          style={{
            border: `1px solid ${isPrivate ? "#fb291a" : "#e2e8f0"}`,
            cursor: "pointer",
          }}
          onClick={() => setIsPrivate(true)}
        >
          <Radio
            value="private"
            color="vntez"
            label={
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <IconLock
                  size={18}
                  color="#ea580c"
                  style={{ flexShrink: 0, marginTop: 2 }}
                />
                <Box>
                  <Text fz={13} fw={600} c="#0f172a">
                    Private
                  </Text>
                  <Text fz={12} c="#64748b">
                    Chỉ bạn và những người cộng tác được chỉ định mới có quyền
                    truy cập repository này.
                  </Text>
                </Box>
              </Group>
            }
          />
        </Paper>
      </Stack>
    </Radio.Group>
  );
}
