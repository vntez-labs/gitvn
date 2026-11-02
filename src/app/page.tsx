"use client";

import { useState } from "react";
import {
  Container, Title, Text, Button, Group, Badge, Card, SimpleGrid,
  Stack, Box, Paper, Tabs, Anchor, ThemeIcon, Code
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useClipboard } from "@mantine/hooks";
import {
  IconGitBranch, IconBolt, IconRobot, IconShieldCheck,
  IconCopy, IconCheck, IconArrowRight, IconStar, IconFolders, IconSparkles
} from "@tabler/icons-react";
import Link from "next/link";

// ==========================================
// SVG ILLUSTRATIONS (Dùng màu primary của bạn)
// ==========================================
const TreeIllustration = () => (
  <svg viewBox="0 0 200 120" fill="none" style={{ width: "100%", height: "auto", opacity: 0.8 }}>
    <rect x="10" y="10" width="50" height="100" rx="4" stroke="var(--mantine-color-indigo-5)" strokeWidth="1.5" />
    <rect x="70" y="30" width="50" height="80" rx="4" stroke="var(--mantine-color-blue-4)" strokeWidth="1.5" />
    <rect x="130" y="50" width="50" height="60" rx="4" stroke="var(--mantine-color-indigo-3)" strokeWidth="1.5" />
    <path d="M60 40 L70 40" stroke="var(--mantine-color-indigo-5)" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M120 60 L130 60" stroke="var(--mantine-color-blue-4)" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);

const TaskIllustration = () => (
  <svg viewBox="0 0 200 120" fill="none" style={{ width: "100%", height: "auto", opacity: 0.8 }}>
    <rect x="30" y="20" width="140" height="80" rx="6" stroke="var(--mantine-color-gray-6)" strokeWidth="1.5" />
    <rect x="45" y="35" width="110" height="15" rx="3" fill="var(--mantine-color-indigo-9)" stroke="var(--mantine-color-indigo-5)" strokeWidth="1" />
    <rect x="45" y="60" width="80" height="15" rx="3" stroke="var(--mantine-color-gray-5)" strokeWidth="1.5" />
    <rect x="45" y="85" width="60" height="15" rx="3" stroke="var(--mantine-color-red-5)" strokeWidth="1.5" />
  </svg>
);

export default function GitVNLanding() {
  const clipboard = useClipboard({ timeout: 2000 });
  const [activePreset, setActivePreset] = useState<string | null>("standup");

  const prompts: Record<string, string> = {
    standup: `Role: Senior Engineering Lead
Objective: Sprint audit and blocker breakdown
Repository: gitvn-workspace (Branch: main)

Active Sprint Items:
- [DONE] virtual-tree-rendering (Assigned: @alex)
- [IN PROGRESS] token-vault (Assigned: @sarah | 75%)
- [BLOCKED] r2-sync (Assigned: @daniel)
  Detail: S3 Presigned URL expiration mismatch.

Required Output:
1. Identify critical path bottlenecks.
2. Produce 3 remediation steps for @daniel.
3. Generate concise markdown summary.`,
    report: `Role: Technical Project Director
Objective: Weekly milestone synthesis

Velocity: 14 Done / 2 In-Progress / 1 Blocked
Deliverables:
- Unified Git tree parser (138ms latency)
- LLM prompt pipeline
- Zero-friction task matrix

Summarize milestone progress into 3 executive bullet points.`,
    raw: `{\n  "project": "gitvn",\n  "metrics": { "total": 17, "done": 14, "blocked": 1 }\n}`,
  };

  const currentBuffer = activePreset ? prompts[activePreset] : "";

  const handleCopy = () => {
    clipboard.copy(currentBuffer);
    notifications.show({
      title: "Prompt Copied",
      message: "Ready to paste into Claude or ChatGPT.",
      color: "indigo", // Đổi thành màu primary của bạn
    });
  };

  return (
    <Box
      bg="#0a0a0a" // Nền tối nhưng không phải đen tuyền
      c="gray.2"
      mih="100vh"
      style={{
        // Nhuộm nhẹ màu primary vào background
        backgroundImage: `radial-gradient(circle 800px at 50% 0px, var(--mantine-color-indigo-9), transparent 80%)`,
      }}
    >
      {/* ================= NAVBAR ================= */}
      <Box
        component="header"
        py="md"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(10, 10, 10, 0.6)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container size="lg">
          <Group justify="space-between">
            <Group gap="xs">
              <Box
                w={28}
                h={28}
                style={{
                  borderRadius: 6,
                  background: "linear-gradient(135deg, var(--mantine-color-indigo-5) 0%, var(--mantine-color-blue-4) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                }}
              >
                <IconGitBranch size={16} stroke={2.5} />
              </Box>
              <Text fw={700} fz="lg" lts="-0.03em" c="#ffffff">
                GitVN
              </Text>
            </Group>

            <Group gap="lg">
              <Anchor href="#architecture" fz="sm" c="gray.4" underline="never" fw={500}>Features</Anchor>
              <Anchor href="#benchmark" fz="sm" c="gray.4" underline="never" fw={500}>Performance</Anchor>
              <Group gap="xs" ml="md">
                <a href="/api/integrations/github">
                  <Button
                    size="sm"
                    radius="md"
                    color="indigo" // Đổi thành primary color của bạn
                    style={{ fontWeight: 600 }}
                  >
                    Connect GitHub
                  </Button>
                </a>
              </Group>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* ================= HERO ================= */}
      <Container size="md" pt={{ base: 80, md: 120 }} pb={60}>
        <Stack align="center" gap="xl" ta="center">

          <Badge
            variant="light"
            color="indigo" // Primary
            size="lg"
            radius="xl"
            leftSection={<IconSparkles size={14} />}
            style={{ textTransform: "none", fontWeight: 500, letterSpacing: "0.5px" }}
          >
            Next-gen Git Dashboard & AI Prompt Pipeline
          </Badge>

          <Title
            order={1}
            fz={{ base: 44, sm: 64, md: 84 }}
            fw={800}
            lh={1.05}
            style={{ letterSpacing: "-0.05em", color: "#ffffff" }}
          >
            Git, but simpler. <br />
            <Text
              component="span"
              inherit
              variant="gradient"
              gradient={{ from: "indigo.4", to: "blue.4", deg: 90 }} // Gradient màu primary
            >
              Built for pure velocity.
            </Text>
          </Title>

          <Text c="gray.4" maw={600} fz={{ base: "lg", sm: "xl" }} lh={1.5}>
            Browse large repositories instantly with a visual tree. Skip Jira ceremonies.
            Turn your live sprint state into perfect LLM prompts with one click.
          </Text>

          <Group mt="md" gap="md">
            <Button
              size="lg"
              radius="md"
              color="indigo" // Primary
              rightSection={<IconArrowRight size={18} />}
              style={{ fontWeight: 600, boxShadow: "0 4px 20px var(--mantine-color-indigo-9)" }}
            >
              Start Building Free
            </Button>
            <Button
              size="lg"
              radius="md"
              variant="default"
              bg="transparent"
              c="gray.3"
              onClick={handleCopy}
              leftSection={clipboard.copied ? <IconCheck size={18} color="var(--mantine-color-teal-5)" /> : <IconCopy size={18} color="var(--mantine-color-indigo-4)" />}
              style={{ borderColor: "rgba(255,255,255,0.15)", fontWeight: 500 }}
            >
              {clipboard.copied ? "Copied!" : "Copy LLM Prompt"}
            </Button>
          </Group>
        </Stack>

        {/* ================= CLEAN APP PREVIEW ================= */}
        <Box mt={{ base: 60, md: 100 }} style={{ position: "relative" }}>
          <Paper
            radius="xl"
            bg="#111111"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 30px 100px -20px rgba(0, 0, 0, 1), 0 0 0 1px rgba(99, 102, 241, 0.1)", // Viền sáng nhẹ màu primary
              overflow: "hidden",
            }}
          >
            {/* Window Header */}
            <Group justify="space-between" px="lg" py="md" bg="#0a0a0a" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <Group gap={8}>
                <Box w={12} h={12} style={{ borderRadius: "50%", backgroundColor: "#27272a" }} />
                <Box w={12} h={12} style={{ borderRadius: "50%", backgroundColor: "#27272a" }} />
                <Box w={12} h={12} style={{ borderRadius: "50%", backgroundColor: "#27272a" }} />
                <Text fz={13} c="#71717a" ml="sm" fw={500} style={{ fontFamily: "monospace" }}>
                  gitvn / tree-indexer.ts
                </Text>
              </Group>
              <Badge size="sm" color="teal" variant="light" radius="sm" leftSection={<IconBolt size={12} />}>
                138ms Loaded
              </Badge>
            </Group>

            {/* Clean 2-Pane Content */}
            <Box style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: 400, backgroundColor: "#111111" }}>

              {/* Pane 1: Minimal File Tree */}
              <Box p="lg" style={{ borderRight: "1px solid rgba(255, 255, 255, 0.06)", fontFamily: "monospace", fontSize: 13 }}>
                <Group gap={8} mb="md" c="gray.4">
                  <IconFolders size={16} />
                  <Text fw={600} fz="sm" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Explorer</Text>
                </Group>
                <Stack gap={6} c="gray.4">
                  <Group gap={8}><IconFolderIcon /> src</Group>
                  <Group gap={8} pl="md"><IconFolderIcon /> core</Group>
                  <Group gap={8} pl="xl" bg="var(--mantine-color-indigo-9)" py={4} px={8} c="indigo.2" style={{ borderRadius: 6 }}>
                    <IconFileCodeIcon /> tree-indexer.ts
                  </Group>
                  <Group gap={8} pl="xl"><IconFileCodeIcon /> prompt-gen.ts</Group>
                  <Group gap={8}><IconFileIcon /> .project-tasks.json</Group>
                </Stack>
              </Box>

              {/* Pane 2: Prompt Terminal */}
              <Box p="xl" bg="#0a0a0a">
                <Tabs value={activePreset} onChange={setActivePreset} variant="pills" color="indigo" radius="md">
                  <Group justify="space-between" mb="lg">
                    <Tabs.List bg="#111111" p={4} style={{ borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <Tabs.Tab value="standup" fz={13} py={6} px="md" leftSection={<IconRobot size={14} />}>Standup</Tabs.Tab>
                      <Tabs.Tab value="report" fz={13} py={6} px="md">Report</Tabs.Tab>
                      <Tabs.Tab value="raw" fz={13} py={6} px="md">JSON</Tabs.Tab>
                    </Tabs.List>
                    <Button size="xs" color="indigo" variant="light" radius="md" onClick={handleCopy} leftSection={clipboard.copied ? <IconCheck size={14} /> : <IconCopy size={14} />}>
                      {clipboard.copied ? "Copied" : "Copy Prompt"}
                    </Button>
                  </Group>

                  <Box
                    p="md"
                    bg="#111111"
                    style={{
                      borderRadius: 8,
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      fontFamily: "monospace",
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "#d4d4d8",
                      whiteSpace: "pre-wrap",
                      minHeight: 280,
                    }}
                  >
                    {currentBuffer}
                  </Box>
                </Tabs>
              </Box>

            </Box>
          </Paper>
        </Box>
      </Container>

      {/* ================= ARCHITECTURE (BENTO GRID) ================= */}
      <Container size="lg" py={80} id="architecture">
        <style>{`
          .bento-card {
            transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          }
          .bento-card:hover {
            transform: translateY(-2px);
            border-color: var(--mantine-color-indigo-5) !important; /* Viền sáng lên khi hover */
            box-shadow: 0 8px 30px -10px var(--mantine-color-indigo-9);
          }
          .bento-card:hover .arrow-icon {
            transform: translateX(4px);
            color: var(--mantine-color-indigo-4) !important;
          }
          .arrow-icon {
            transition: transform 0.2s ease, color 0.2s ease;
          }
        `}</style>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={24} verticalSpacing={24}>

          {/* Lớn 1 */}
          <Card className="bento-card" bg="#111111" p={32} radius="xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)", gridColumn: "span 2" }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box>
                <Group gap={8} mb="sm">
                  <ThemeIcon size={28} radius="md" color="indigo" variant="light">
                    <IconBolt size={18} />
                  </ThemeIcon>
                  <Text fw={600} fz="xl" c="#ffffff">Single-Call Tree Engine</Text>
                </Group>
                <Text fz="md" c="gray.4" lh={1.6} maw={400}>
                  Load entire repositories in one request using the Git Trees API. Zero reloads, zero layout shifts, instant navigation.
                </Text>
                <Group gap={6} mt="xl" style={{ cursor: "pointer" }}>
                  <Text fz="sm" fw={600} c="indigo.4">Learn more</Text>
                  <IconArrowRight size={16} className="arrow-icon" color="var(--mantine-color-indigo-4)" />
                </Group>
              </Box>
              <Box w={160} style={{ flexShrink: 0 }}><TreeIllustration /></Box>
            </Group>
          </Card>

          {/* Nhỏ 1 */}
          <Card className="bento-card" bg="#111111" p={32} radius="xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <ThemeIcon size={32} radius="md" color="indigo" variant="light" mb="md">
              <IconShieldCheck size={20} />
            </ThemeIcon>
            <Text fw={600} fz="xl" c="#ffffff" mb="sm">Git-Native State</Text>
            <Text fz="md" c="gray.4" lh={1.6}>
              Commit your task board alongside your code. Every developer has the exact same context immediately after a git pull.
            </Text>
          </Card>

          {/* Nhỏ 2 */}
          <Card className="bento-card" bg="#111111" p={32} radius="xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <ThemeIcon size={32} radius="md" color="indigo" variant="light" mb="md">
              <IconRobot size={20} />
            </ThemeIcon>
            <Text fw={600} fz="xl" c="#ffffff" mb="sm">Agent-Ready</Text>
            <Text fz="md" c="gray.4" lh={1.6}>
              Export sprint state and blockers directly into structured prompts ready for Claude or GPT-4o in one click.
            </Text>
          </Card>

          {/* Lớn 2 */}
          <Card className="bento-card" bg="#111111" p={32} radius="xl" style={{ border: "1px solid rgba(255, 255, 255, 0.08)", gridColumn: "span 2" }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box>
                <Group gap={8} mb="sm">
                  <ThemeIcon size={28} radius="md" color="indigo" variant="light">
                    <IconStar size={18} />
                  </ThemeIcon>
                  <Text fw={600} fz="xl" c="#ffffff">Zero Ceremony Task Matrix</Text>
                </Group>
                <Text fz="md" c="gray.4" lh={1.6} maw={400}>
                  Forget burndown charts. Track only tasks, owners, and blockers. Synchronized automatically with your repository.
                </Text>
                <Group gap={6} mt="xl" style={{ cursor: "pointer" }}>
                  <Text fz="sm" fw={600} c="indigo.4">Explore Task Matrix</Text>
                  <IconArrowRight size={16} className="arrow-icon" color="var(--mantine-color-indigo-4)" />
                </Group>
              </Box>
              <Box w={160} style={{ flexShrink: 0 }}><TaskIllustration /></Box>
            </Group>
          </Card>
        </SimpleGrid>
      </Container>

      {/* ================= FOOTER ================= */}
      <Box component="footer" pt={60} pb={40} style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "#050505" }}>
        <Container size="lg">
          <Group justify="space-between">
            <Group gap="xs">
              <Box w={24} h={24} bg="indigo.5" style={{ borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconGitBranch size={14} color="white" stroke={3} />
              </Box>
              <Text fw={700} fz="md" c="#ffffff">GitVN</Text>
            </Group>
            <Group gap="xl">
              <Anchor className="footer-link" fz="sm" c="gray.5" underline="never">Documentation</Anchor>
              <Anchor className="footer-link" fz="sm" c="gray.5" underline="never">Privacy</Anchor>
              <Anchor className="footer-link" fz="sm" c="gray.5" underline="never">GitHub</Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

// Các component icon phụ trợ cho File Tree
function IconFolderIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>;
}
function IconFileCodeIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mantine-color-indigo-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>;
}
function IconFileIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path></svg>;
}
