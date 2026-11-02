"use client";

import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBolt,
  IconGitBranch,
  IconRobot,
  IconShieldCheck,
  IconSparkles,
  IconStar,
} from "@tabler/icons-react";
import { GitVNLogo } from "@/components/brand/GitVNLogo";
import axios from "axios";
import { useEffect, useState } from "react";

// ==========================================
// SVG ILLUSTRATIONS (Light theme with VNTEZ fiery accents)
// ==========================================
const TreeIllustration = () => (
  <svg
    viewBox="0 0 200 120"
    fill="none"
    style={{ width: "100%", height: "auto" }}
  >
    <rect
      x="10"
      y="10"
      width="50"
      height="100"
      rx="6"
      fill="var(--mantine-color-vntez-0)"
      stroke="var(--mantine-color-vntez-6)"
      strokeWidth="1.5"
    />
    <rect
      x="70"
      y="30"
      width="50"
      height="80"
      rx="6"
      fill="#ffe3df"
      stroke="#f77241"
      strokeWidth="1.5"
    />
    <rect
      x="130"
      y="50"
      width="50"
      height="60"
      rx="6"
      fill="var(--mantine-color-vntez-0)"
      stroke="var(--mantine-color-vntez-4)"
      strokeWidth="1.5"
    />
    <path
      d="M60 40 L70 40"
      stroke="var(--mantine-color-vntez-6)"
      strokeWidth="1.5"
      strokeDasharray="3 3"
    />
    <path
      d="M120 60 L130 60"
      stroke="#f77241"
      strokeWidth="1.5"
      strokeDasharray="3 3"
    />
  </svg>
);

const TaskIllustration = () => (
  <svg
    viewBox="0 0 200 120"
    fill="none"
    style={{ width: "100%", height: "auto" }}
  >
    <rect
      x="30"
      y="20"
      width="140"
      height="80"
      rx="8"
      fill="#f8fafc"
      stroke="var(--mantine-color-gray-3)"
      strokeWidth="1.5"
    />
    <rect
      x="45"
      y="35"
      width="110"
      height="15"
      rx="4"
      fill="var(--mantine-color-vntez-0)"
      stroke="var(--mantine-color-vntez-6)"
      strokeWidth="1"
    />
    <rect
      x="45"
      y="60"
      width="80"
      height="15"
      rx="4"
      fill="var(--mantine-color-gray-1)"
      stroke="var(--mantine-color-gray-4)"
      strokeWidth="1"
    />
    <rect
      x="45"
      y="85"
      width="60"
      height="15"
      rx="4"
      fill="#ffe3df"
      stroke="#f77241"
      strokeWidth="1"
    />
  </svg>
);

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
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
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
                Features
              </Anchor>
              <Anchor
                href="#benchmark"
                fz="sm"
                c="gray.7"
                underline="never"
                fw={500}
              >
                Performance
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
                  {isLoggedIn ? "Vào Workspace →" : "Connect GitHub"}
                </Button>
              </Group>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* ================= HERO ================= */}
      <Container size="md" pt={{ base: 70, md: 100 }} pb={{ base: 60, md: 90 }}>
        <Stack align="center" gap="xl" ta="center">
          <Badge
            variant="light"
            color="vntez"
            size="lg"
            radius="xl"
            leftSection={<IconSparkles size={14} />}
            style={{
              textTransform: "none",
              fontWeight: 500,
              letterSpacing: "0.2px",
            }}
          >
            Next-gen Git Workspace & AI Prompt Pipeline
          </Badge>

          <Title
            order={1}
            fz={{ base: 40, sm: 56, md: 72 }}
            fw={800}
            lh={1.1}
            style={{ letterSpacing: "-0.04em", color: "#0f172a" }}
          >
            Git, but simpler. <br />
            <Text
              component="span"
              inherit
              variant="gradient"
              gradient={{ from: "#fb291a", to: "#f77241", deg: 90 }}
            >
              Built for pure velocity.
            </Text>
          </Title>

          <Text c="gray.6" maw={620} fz={{ base: "lg", sm: "xl" }} lh={1.6}>
            Browse large repositories instantly with a visual tree. Skip Jira
            ceremonies. Turn your live sprint state into perfect LLM prompts
            with one click.
          </Text>

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
              {isLoggedIn ? "Vào Workspace ngay" : "Start Building Free"}
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
              Explore Features
            </Button>
          </Group>
        </Stack>
      </Container>

      {/* ================= ARCHITECTURE (BENTO GRID) ================= */}
      <Container size="lg" py={80} id="architecture">
        <style>{`
          .bento-card {
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .bento-card:hover {
            transform: translateY(-3px);
            border-color: #ffa497 !important;
            box-shadow: 0 12px 30px -8px rgba(251, 41, 26, 0.16) !important;
          }
          .bento-card:hover .arrow-icon {
            transform: translateX(4px);
            color: #fb291a !important;
          }
          .arrow-icon {
            transition: transform 0.2s ease, color 0.2s ease;
          }
        `}</style>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={24} verticalSpacing={24}>
          {/* Lớn 1 */}
          <Card
            className="bento-card"
            bg="#ffffff"
            p={32}
            radius="xl"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
              gridColumn: "span 2",
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box>
                <Group gap={8} mb="sm">
                  <ThemeIcon
                    size={28}
                    radius="md"
                    color="vntez"
                    variant="light"
                  >
                    <IconBolt size={18} />
                  </ThemeIcon>
                  <Text fw={600} fz="xl" c="#0f172a">
                    Single-Call Tree Engine
                  </Text>
                </Group>
                <Text fz="md" c="gray.6" lh={1.6} maw={400}>
                  Load entire repositories in one request using the Git Trees
                  API. Zero reloads, zero layout shifts, instant navigation.
                </Text>
                <Group gap={6} mt="xl" style={{ cursor: "pointer" }}>
                  <Text fz="sm" fw={600} c="vntez.6">
                    Learn more
                  </Text>
                  <IconArrowRight
                    size={16}
                    className="arrow-icon"
                    color="#fb291a"
                  />
                </Group>
              </Box>
              <Box w={160} style={{ flexShrink: 0 }}>
                <TreeIllustration />
              </Box>
            </Group>
          </Card>

          {/* Nhỏ 1 */}
          <Card
            className="bento-card"
            bg="#ffffff"
            p={32}
            radius="xl"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
            }}
          >
            <ThemeIcon
              size={32}
              radius="md"
              color="vntez"
              variant="light"
              mb="md"
            >
              <IconShieldCheck size={20} />
            </ThemeIcon>
            <Text fw={600} fz="xl" c="#0f172a" mb="sm">
              Git-Native State
            </Text>
            <Text fz="md" c="gray.6" lh={1.6}>
              Commit your task board alongside your code. Every developer has
              the exact same context immediately after a git pull.
            </Text>
          </Card>

          {/* Nhỏ 2 */}
          <Card
            className="bento-card"
            bg="#ffffff"
            p={32}
            radius="xl"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
            }}
          >
            <ThemeIcon
              size={32}
              radius="md"
              color="vntez"
              variant="light"
              mb="md"
            >
              <IconRobot size={20} />
            </ThemeIcon>
            <Text fw={600} fz="xl" c="#0f172a" mb="sm">
              Agent-Ready
            </Text>
            <Text fz="md" c="gray.6" lh={1.6}>
              Export sprint state and blockers directly into structured prompts
              ready for Claude or GPT-4o in one click.
            </Text>
          </Card>

          {/* Lớn 2 */}
          <Card
            className="bento-card"
            bg="#ffffff"
            p={32}
            radius="xl"
            style={{
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow:
                "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)",
              gridColumn: "span 2",
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box>
                <Group gap={8} mb="sm">
                  <ThemeIcon
                    size={28}
                    radius="md"
                    color="vntez"
                    variant="light"
                  >
                    <IconStar size={18} />
                  </ThemeIcon>
                  <Text fw={600} fz="xl" c="#0f172a">
                    Zero Ceremony Task Matrix
                  </Text>
                </Group>
                <Text fz="md" c="gray.6" lh={1.6} maw={400}>
                  Forget burndown charts. Track only tasks, owners, and
                  blockers. Synchronized automatically with your repository.
                </Text>
                <Group gap={6} mt="xl" style={{ cursor: "pointer" }}>
                  <Text fz="sm" fw={600} c="vntez.6">
                    Explore Task Matrix
                  </Text>
                  <IconArrowRight
                    size={16}
                    className="arrow-icon"
                    color="#fb291a"
                  />
                </Group>
              </Box>
              <Box w={160} style={{ flexShrink: 0 }}>
                <TaskIllustration />
              </Box>
            </Group>
          </Card>
        </SimpleGrid>
      </Container>

      {/* ================= FOOTER ================= */}
      <Box
        component="footer"
        pt={60}
        pb={40}
        style={{
          borderTop: "1px solid rgba(0, 0, 0, 0.06)",
          backgroundColor: "#f8fafc",
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Group gap="xs">
              <GitVNLogo size={24} />
              <Text fw={700} fz="md" c="#0f172a">
                Git<span style={{ color: "#fb291a" }}>VN</span>
              </Text>
            </Group>
            <Group gap="xl">
              <Anchor
                className="footer-link"
                fz="sm"
                c="gray.6"
                underline="never"
              >
                Documentation
              </Anchor>
              <Anchor
                className="footer-link"
                fz="sm"
                c="gray.6"
                underline="never"
              >
                Privacy
              </Anchor>
              <Anchor
                className="footer-link"
                fz="sm"
                c="gray.6"
                underline="never"
              >
                GitHub
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
