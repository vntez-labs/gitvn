import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Bảng màu cam đỏ đặc trưng từ vntez.vercel.app (#fb291a - #f77241)
export const vntezColors: MantineColorsTuple = [
  "#fff1f0", // 0: Nền tint nhạt, active background
  "#ffe3df", // 1: Hover highlight
  "#ffc5be", // 2: Viền nhạt
  "#ffa497", // 3: Viền trung bình
  "#f77241", // 4: Màu cam chuyển tiếp (Secondary gradient)
  "#fb5340", // 5: Màu cam đỏ sáng
  "#fb291a", // 6: Màu thương hiệu chính VNTEZ (Primary)
  "#db1b0e", // 7: Màu hover
  "#b81408", // 8: Màu active / nhấn giữ
  "#7a0c04", // 9: Màu chữ đậm
];

export const theme = createTheme({
  fontFamily:
    "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMonospace: "var(--font-jetbrains-mono), monospace",
  headings: {
    fontFamily:
      "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: "700",
  },
  colors: {
    vntez: vntezColors,
  },
  primaryColor: "vntez",
  primaryShade: 6,
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    Button: {
      defaultProps: {
        color: "vntez",
      },
    },
    Badge: {
      defaultProps: {
        color: "vntez",
      },
    },
    ActionIcon: {
      defaultProps: {
        color: "vntez",
      },
    },
    Progress: {
      defaultProps: {
        color: "vntez",
      },
    },
    Checkbox: {
      defaultProps: {
        color: "vntez",
      },
    },
    Radio: {
      defaultProps: {
        color: "vntez",
      },
    },
    Switch: {
      defaultProps: {
        color: "vntez",
      },
    },
    SegmentedControl: {
      styles: {
        label: {
          "&[data-active]": {
            color: "#fb291a",
          },
        },
      },
    },
  },
});
