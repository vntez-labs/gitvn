"use client";

import { Box, Group, Progress, SimpleGrid, Text, Tooltip } from "@mantine/core";
import type { LanguageStat } from "@/hooks/useRepoOverviewMetrics";

export function LanguageStatsSection({
  languageStats,
}: {
  languageStats: LanguageStat[];
}) {
  if (!languageStats || languageStats.length === 0) return null;

  return (
    <Box mb="xl">
      <Text
        fz={10}
        fw={700}
        c="#64748b"
        mb="xs"
        style={{ letterSpacing: "0.08em" }}
      >
        LANGUAGES
      </Text>

      <Progress.Root
        size="sm"
        radius="xl"
        mb="md"
        style={{ backgroundColor: "#e2e8f0" }}
      >
        {languageStats.map((lang) => (
          <Tooltip
            key={lang.name}
            label={`${lang.name}: ${lang.percent}% (${lang.count} files)`}
            withArrow
          >
            <Progress.Section value={lang.percent} color={lang.color} />
          </Tooltip>
        ))}
      </Progress.Root>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
        {languageStats.map((lang) => (
          <Group key={lang.name} gap="xs">
            <Box
              w={8}
              h={8}
              style={{ borderRadius: "50%", backgroundColor: lang.color }}
            />
            <Text fz={12} c="#0f172a" fw={500}>
              {lang.name}
            </Text>
            <Text fz={12} c="#64748b">
              {lang.percent}%
            </Text>
          </Group>
        ))}
      </SimpleGrid>
    </Box>
  );
}
