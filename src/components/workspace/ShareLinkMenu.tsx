"use client";

import { Button, CopyButton, Menu } from "@mantine/core";
import {
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandTelegram,
  IconChevronDown,
  IconCopy,
  IconFileText,
  IconMail,
  IconShare,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
  buildLinkedinShareUrl,
  buildTelegramShareUrl,
} from "react-share";
import { siteUrl } from "@/lib/site-url";

export function ShareLinkMenu({
  path,
  privateRepo,
  shareTitle,
}: {
  path: string;
  privateRepo: boolean;
  shareTitle: string;
}) {
  const [origin, setOrigin] = useState("");
  const base = privateRepo ? origin : siteUrl;
  const url = base ? new URL(path, base).href : "";
  const options = url
    ? [
        {
          name: "Facebook",
          icon: IconBrandFacebook,
          href: buildFacebookShareUrl(url, {}),
        },
        {
          name: "LinkedIn",
          icon: IconBrandLinkedin,
          href: buildLinkedinShareUrl(url),
        },
        {
          name: "Telegram",
          icon: IconBrandTelegram,
          href: buildTelegramShareUrl(url, { text: shareTitle }),
        },
        {
          name: "Email",
          icon: IconMail,
          href: buildEmailShareUrl(url, { subject: shareTitle }),
        },
      ]
    : [];

  return (
    <Menu
      shadow="md"
      width={250}
      position="bottom-end"
      onOpen={() => setOrigin(window.location.origin)}
      withinPortal
    >
      <Menu.Target>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<IconShare size={15} />}
          rightSection={<IconChevronDown size={13} />}
        >
          Chia sẻ
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        {privateRepo && (
          <Menu.Label style={{ whiteSpace: "normal" }}>
            Người nhận cần đăng nhập và có quyền vào repo.
          </Menu.Label>
        )}
        {options.map(({ name, icon: Icon, href }) => (
          <Menu.Item
            key={name}
            component="a"
            href={href}
            target={name === "Email" ? undefined : "_blank"}
            rel={name === "Email" ? undefined : "noopener noreferrer"}
            leftSection={<Icon size={17} />}
          >
            {name}
          </Menu.Item>
        ))}
        <Menu.Divider />
        <CopyButton
          value={`${shareTitle}
${url}`}
        >
          {({ copy, copied }) => (
            <Menu.Item
              leftSection={<IconFileText size={17} />}
              closeMenuOnClick={false}
              onClick={copy}
            >
              {copied ? "Đã sao chép nội dung" : "Sao chép nội dung"}
            </Menu.Item>
          )}
        </CopyButton>
        <CopyButton value={url}>
          {({ copy, copied }) => (
            <Menu.Item
              leftSection={<IconCopy size={17} />}
              closeMenuOnClick={false}
              onClick={copy}
            >
              {copied ? "Đã sao chép link" : "Sao chép link"}
            </Menu.Item>
          )}
        </CopyButton>
      </Menu.Dropdown>
    </Menu>
  );
}
