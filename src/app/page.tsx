"use client";

import {
  Anchor,
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
import { LandingBentoGrid } from "@/components/landing/LandingBentoGrid";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function GitVNLanding() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    axios
      .get("/api/user")
      .then((res) => {
        if (res.data?.user) setIsLoggedIn(true);
      })
      .catch(() => {});
  }, []);

  return (
    <Box
      bg="#ffffff"
      c="gray.8"
      mih="100vh"
      style={{
        backgroundImage: `radial-gradient(circle 900px at 50% -100px, rgba(251, 41, 26, 0.08), transparent 80%), radial-gradient(circle 600px at 85% 150px, rgba(247, 114, 65, 0.05), transparent 70%)`,
      }}
    >
      {/* ================= NAVBAR ================= */}
      <Box
        component="header"
        py="md"
        style={{
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          backgroundColor: "rgba(255, 255, 255, 0.75)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Group gap="xs">
              <GitVNLogo size={30} />
              <Text fw={700} fz="lg" lts="-0.03em" c="#0f172a">
                Git<span style={{ color: "#fb291a" }}>VN</span>
              </Text>
            </Group>

            <Group gap="lg">
              <Anchor
                href="#architecture"
                fz="sm"
                c="gray.7"
                underline="never"
                fw={500}
              >
                Tính năng
              </Anchor>
              <Anchor
                href="https://github.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                fz="sm"
                c="gray.7"
                underline="never"
                fw={500}
              >
                Tác giả
              </Anchor>
              <Group gap="xs" ml="md">
                <Button
                  component="a"
                  href={isLoggedIn ? "/dashboard" : "/api/integrations/github"}
                  size="sm"
                  radius="md"
                  color="vntez"
                  style={{
                    fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(251, 41, 26, 0.25)",
                  }}
                >
                  {isLoggedIn ? "Vào Workspace →" : "Kết nối GitHub"}
                </Button>
              </Group>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* ================= HERO ================= */}
      <Container size="md" pt={{ base: 80, md: 120 }} pb={{ base: 60, md: 90 }}>
        <Stack align="center" gap="xl" ta="center">
          <Title
            order={1}
            fz={{ base: 42, sm: 60, md: 76 }}
            fw={800}
            lh={1.15}
            style={{ letterSpacing: "-0.04em", color: "#0f172a" }}
          >
            Git, nhưng tinh gọn hơn. <br />
            <Text
              component="span"
              inherit
              variant="gradient"
              gradient={{ from: "#fb291a", to: "#f77241", deg: 90 }}
            >
              Tối ưu cho tốc độ vượt trội.
            </Text>
          </Title>

          <Group mt="md" gap="md">
            <Button
              component="a"
              href={isLoggedIn ? "/dashboard" : "/api/integrations/github"}
              size="lg"
              radius="md"
              color="vntez"
              rightSection={<IconArrowRight size={18} />}
              style={{
                fontWeight: 600,
                boxShadow: "0 6px 20px rgba(251, 41, 26, 0.28)",
              }}
            >
              {isLoggedIn ? "Vào Workspace ngay" : "Bắt đầu miễn phí"}
            </Button>
            <Button
              component="a"
              href="#architecture"
              size="lg"
              radius="md"
              variant="default"
              bg="white"
              c="gray.8"
              style={{
                borderColor: "rgba(0, 0, 0, 0.12)",
                fontWeight: 500,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              Khám phá tính năng
            </Button>
          </Group>

          {/* Author Badge */}
          <Group
            gap={8}
            mt="md"
            style={{
              backgroundColor: "#f8fafc",
              padding: "6px 14px",
              borderRadius: 24,
              border: "1px solid #e2e8f0",
            }}
          >
            <Avatar
              src="https://github.com/hnamhocit.png"
              alt="hnamhocit"
              size={20}
              radius="xl"
            />
            <Text fz={12} c="#64748b">
              Phát triển bởi{" "}
              <Anchor
                href="https://github.com/hnamhocit"
                target="_blank"
                rel="noopener noreferrer"
                fw={600}
                c="#0f172a"
                underline="hover"
              >
                Nguyễn Hoàng Nam (@hnamhocit)
              </Anchor>
            </Text>
          </Group>
        </Stack>
      </Container>

      {/* ================= ARCHITECTURE (BENTO GRID) ================= */}
      <LandingBentoGrid />

      {/* ================= FOOTER ================= */}
      <LandingFooter />
    </Box>
  );
}
