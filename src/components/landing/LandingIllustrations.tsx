import type { FC } from "react";

export const TreeIllustration: FC = () => (
  <svg
    viewBox="0 0 200 120"
    fill="none"
    style={{ width: "100%", height: "auto" }}
    aria-hidden="true"
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

export const TaskIllustration: FC = () => (
  <svg
    viewBox="0 0 200 120"
    fill="none"
    style={{ width: "100%", height: "auto" }}
    aria-hidden="true"
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
