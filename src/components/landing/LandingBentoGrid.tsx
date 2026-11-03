import {
  Box,
  Card,
  Container,
  Group,
  SimpleGrid,
  Text,
  ThemeIcon,
} from "@mantine/core";
import {
  IconArrowRight,
  IconBolt,
  IconRobot,
  IconShieldCheck,
  IconStar,
} from "@tabler/icons-react";
import type { FC } from "react";
import { TaskIllustration, TreeIllustration } from "./LandingIllustrations";

export const LandingBentoGrid: FC = () => {
  return (
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
                <ThemeIcon size={28} radius="md" color="vntez" variant="light">
                  <IconBolt size={18} />
                </ThemeIcon>
                <Text fw={600} fz="xl" c="#0f172a">
                  Cây thư mục siêu tốc (Tree Engine)
                </Text>
              </Group>
              <Text fz="md" c="gray.6" lh={1.6} maw={400}>
                Tải toàn bộ cấu trúc dự án chỉ trong 1 request duy nhất qua Git
                Trees API. Tải tức thì, không giật lag, không reload trang.
              </Text>
              <Group gap={6} mt="xl" style={{ cursor: "pointer" }}>
                <Text fz="sm" fw={600} c="vntez.6">
                  Tìm hiểu thêm
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
            Lưu trữ trực tiếp trong Git
          </Text>
          <Text fz="md" c="gray.6" lh={1.6}>
            Commit bảng Kanban và task trực tiếp vào repository mã nguồn. Cả
            team đều có chung ngữ cảnh ngay sau mỗi lệnh git pull.
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
            Tối ưu cho AI Agent
          </Text>
          <Text fz="md" c="gray.6" lh={1.6}>
            Xuất trạng thái sprint và task tồn đọng thành prompt chuẩn chỉnh cho
            Claude, GPT-4o hoặc DeepSeek chỉ với 1 cú nhấp chuột.
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
                <ThemeIcon size={28} radius="md" color="vntez" variant="light">
                  <IconStar size={18} />
                </ThemeIcon>
                <Text fw={600} fz="xl" c="#0f172a">
                  Quản lý công việc tinh gọn
                </Text>
              </Group>
              <Text fz="md" c="gray.6" lh={1.6} maw={400}>
                Bỏ qua những quy trình rườm rà. Theo dõi task, người thực hiện
                và tiến độ trực quan. Tự động đồng bộ với Pull Request trên
                GitHub.
              </Text>
              <Group gap={6} mt="xl" style={{ cursor: "pointer" }}>
                <Text fz="sm" fw={600} c="vntez.6">
                  Khám phá bảng Kanban
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
  );
};
