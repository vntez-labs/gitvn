import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconCompass,
  IconGitBranch,
  IconHome,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import type { Metadata } from "next";
import Link from "next/link";
import { GitVNLogo } from "@/components/brand/GitVNLogo";

export const metadata: Metadata = {
  title: "404 - Không tìm thấy trang",
  description: "Trang bạn đang tìm kiếm không tồn tại trên hệ thống GitVN.",
};

export default function NotFound() {
  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navbar Header */}
      <Box
        px="xl"
        py="md"
        style={{
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <Group justify="space-between" align="center">
          <Link href="/" style={{ textDecoration: "none" }}>
            <Group gap="xs">
              <GitVNLogo size={32} />
              <Text fw={800} fz={18} c="#0f172a">
                Git<span style={{ color: "#fb291a" }}>VN</span>
              </Text>
            </Group>
          </Link>

          <Group gap="sm">
            <Link href="/dashboard" style={{ textDecoration: "none" }}>
              <Button
                size="xs"
                variant="default"
                radius="md"
                leftSection={<IconLayoutDashboard size={14} />}
              >
                Dashboard
              </Button>
            </Link>
          </Group>
        </Group>
      </Box>

      {/* Main 404 Hero */}
      <Box
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <Container size="sm" ta="center">
          <Paper
            p={{ base: "xl", sm: 50 }}
            radius="lg"
            style={{
              border: "1px solid #ffc5be",
              backgroundColor: "#fff1f0",
              boxShadow: "0 10px 30px rgba(251, 41, 26, 0.05)",
            }}
          >
            <Stack align="center" gap="md">
              <Badge
                size="xl"
                variant="filled"
                color="vntez"
                radius="md"
                px="lg"
                py="sm"
                styles={{
                  root: {
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    height: "auto",
                  },
                }}
              >
                404
              </Badge>

              <Title order={1} fz={{ base: 22, sm: 28 }} fw={800} c="#0f172a">
                Không tìm thấy trang yêu cầu
              </Title>

              <Text fz="sm" c="#64748b" maw={460} lh={1.6}>
                Đường dẫn bạn vừa truy cập không tồn tại, đã bị di chuyển hoặc
                bạn chưa có quyền truy cập repository này trong hệ thống.
              </Text>

              <Group justify="center" gap="sm" mt="md" wrap="wrap">
                <Link href="/" style={{ textDecoration: "none" }}>
                  <Button
                    size="sm"
                    color="vntez"
                    radius="md"
                    leftSection={<IconHome size={16} />}
                    style={{ fontWeight: 600 }}
                  >
                    Trang chủ
                  </Button>
                </Link>
                <Link href="/dashboard" style={{ textDecoration: "none" }}>
                  <Button
                    size="sm"
                    variant="default"
                    radius="md"
                    leftSection={<IconLayoutDashboard size={16} />}
                    style={{ fontWeight: 600, backgroundColor: "#ffffff" }}
                  >
                    Vào Dashboard
                  </Button>
                </Link>
              </Group>

              <Paper
                mt="lg"
                p="sm"
                bg="#ffffff"
                radius="md"
                style={{ border: "1px solid #e2e8f0", width: "100%" }}
              >
                <Group gap="xs" justify="center">
                  <IconCompass size={15} color="#94a3b8" />
                  <Text fz={12} c="#64748b">
                    Gợi ý: Hãy kiểm tra lại tên tài khoản GitHub hoặc danh sách
                    repository của bạn tại Dashboard.
                  </Text>
                </Group>
              </Paper>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        py="md"
        ta="center"
        style={{ borderTop: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}
      >
        <Text fz={12} c="#94a3b8">
          GitVN Workspace — Powered by VNTEZ Platform
        </Text>
      </Box>
    </Box>
  );
}
