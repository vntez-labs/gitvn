"use client";

import { Alert, Box, Center, Loader } from "@mantine/core";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PdfPreview = dynamic(
  () => import("./PdfPreview").then((module) => module.PdfPreview),
  {
    ssr: false,
    loading: () => (
      <Center p="xl">
        <Loader aria-label="Đang tải trình xem PDF" />
      </Center>
    ),
  },
);

interface DocumentPreviewProps {
  filename: string;
  format: "pdf" | "docx";
  url: string;
}

type Preview = { html: string } | { message: string };

export function DocumentPreview({
  filename,
  format,
  url,
}: DocumentPreviewProps) {
  if (format === "pdf") return <PdfPreview url={url} filename={filename} />;
  return <DocxPreview url={url} filename={filename} />;
}

function DocxPreview({ filename, url }: Omit<DocumentPreviewProps, "format">) {
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("Không tải được tài liệu.");
      const file = await response.blob();
      if (controller.signal.aborted) return;

      const { renderAsync } = await import("docx-preview");
      if (controller.signal.aborted) return;
      const container = document.createElement("div");
      await renderAsync(file, container, undefined, {
        useBase64URL: true,
        renderAltChunks: false,
      });
      if (controller.signal.aborted) return;

      setPreview({
        html: `<!doctype html><html lang="vi"><head><meta charset="utf-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'">
          <style>body { margin: 0; } .docx-wrapper { width: max-content; min-width: 100%; box-sizing: border-box; }</style>
          </head><body>${container.innerHTML}</body></html>`,
      });
    }

    void load().catch(() => {
      if (!controller.signal.aborted) {
        setPreview({
          message:
            "Không thể xem tài liệu. Hãy thử tải file gốc hoặc chọn lại file.",
        });
      }
    });

    return () => controller.abort();
  }, [url]);

  if (!preview) {
    return (
      <Center p="xl">
        <Loader aria-label="Đang tải tài liệu" />
      </Center>
    );
  }

  if ("message" in preview) {
    return (
      <Alert m="md" color="yellow">
        {preview.message}
      </Alert>
    );
  }

  return (
    <Box
      component="iframe"
      title={filename}
      srcDoc={preview.html}
      sandbox=""
      style={{ flex: 1, width: "100%", border: 0, minHeight: 320 }}
    />
  );
}
