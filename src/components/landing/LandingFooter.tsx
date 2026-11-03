import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  SimpleGrid,
  Text,
} from "@mantine/core";
import { IconBrandFacebook, IconBrandGithub } from "@tabler/icons-react";
import type { FC } from "react";
import { GitVNLogo } from "@/components/brand/GitVNLogo";

export const LandingFooter: FC = () => {
  return (
    <Box
      component="footer"
      pt={50}
      pb={36}
      style={{
        borderTop: "1px solid rgba(0, 0, 0, 0.06)",
        backgroundColor: "#f8fafc",
      }}
    >
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb="xl">
          <Box>
            <Group gap="xs" mb="xs">
              <GitVNLogo size={24} />
              <Text fw={700} fz="md" c="#0f172a">
                Git<span style={{ color: "#fb291a" }}>VN</span> Workspace
              </Text>
            </Group>
            <Text fz="sm" c="gray.6" maw={420} lh={1.6}>
              Nền tảng Quản lý Git và Agile Kanban tinh gọn, tích hợp trực tiếp
              mã nguồn với AI Agents và tự động đồng bộ qua GitHub.
            </Text>
          </Box>

          <Box>
            <Text
              fw={700}
              fz="xs"
              c="#64748b"
              mb="xs"
              style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Tác giả
            </Text>
            <Text fz="sm" fw={600} c="#0f172a" mb="xs">
              Nguyễn Hoàng Nam (@hnamhocit)
            </Text>
            <Group gap="xs">
              <Button
                component="a"
                href="https://github.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                variant="default"
                leftSection={<IconBrandGithub size={14} />}
              >
                github/hnamhocit
              </Button>
              <Button
                component="a"
                href="https://facebook.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
                color="blue"
                variant="light"
                leftSection={<IconBrandFacebook size={14} />}
              >
                facebook/hnamhocit
              </Button>
            </Group>
          </Box>
        </SimpleGrid>

        <Divider my="md" color="#e2e8f0" />

        <Group justify="space-between">
          <Text fz="xs" c="gray.5">
            © 2026 GitVN. Được phát triển bởi Nguyễn Hoàng Nam (@hnamhocit).
          </Text>
          <Group gap="lg">
            <Anchor
              href="https://github.com/vntez-labs/gitvn"
              target="_blank"
              rel="noopener noreferrer"
              fz="xs"
              c="gray.6"
            >
              Mã nguồn GitVN
            </Anchor>
            <Anchor
              href="https://github.com/hnamhocit"
              target="_blank"
              rel="noopener noreferrer"
              fz="xs"
              c="gray.6"
            >
              GitHub
            </Anchor>
            <Anchor
              href="https://facebook.com/hnamhocit"
              target="_blank"
              rel="noopener noreferrer"
              fz="xs"
              c="gray.6"
            >
              Facebook
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
};
