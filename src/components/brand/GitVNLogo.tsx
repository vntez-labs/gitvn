"use client";

import React from "react";

interface GitVNLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function GitVNLogo({ size = 28, className, style }: GitVNLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
        ...style,
      }}
      aria-label="GitVN Logo"
    >
      <defs>
        <linearGradient id="gitvnLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb291a" />
          <stop offset="100%" stopColor="#f77241" />
        </linearGradient>
      </defs>

      {/* Background Squircle */}
      <rect width="512" height="512" rx="128" fill="url(#gitvnLogoGrad)" />

      {/* Inner subtle rim */}
      <rect
        x="20"
        y="20"
        width="472"
        height="472"
        rx="112"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeOpacity="0.18"
      />

      {/* Git Branching / 'V' Nodes Monogram */}
      <g
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M168 152 V 360" strokeWidth="42" />
        <path d="M168 256 C 220 256, 320 240, 344 196" strokeWidth="38" />
        <path d="M256 360 L 344 360" strokeWidth="38" />

        <circle
          cx="168"
          cy="152"
          r="34"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="10"
        />
        <circle
          cx="168"
          cy="360"
          r="34"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="10"
        />
        <circle
          cx="344"
          cy="180"
          r="34"
          fill="#ffffff"
          stroke="#ffffff"
          strokeWidth="10"
        />
      </g>
    </svg>
  );
}
