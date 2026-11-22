"use client";

import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Group,
  Loader,
  Text,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const loadError = (
  <Alert color="yellow">
    Không thể xem PDF. Hãy thử tải file gốc hoặc chọn lại file.
  </Alert>
);

export function PdfPreview({
  url,
  filename,
}: {
  url: string;
  filename: string;
}) {
  const { ref, width } = useElementSize();
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);

  return (
    <Box p={{ base: "xs", sm: "md" }} aria-label={filename}>
      {pageCount > 0 && (
        <Group justify="center" gap="sm" mb="sm">
          <ActionIcon
            variant="default"
            aria-label="Trang trước"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <Text size="sm" aria-live="polite">
            Trang {page} / {pageCount}
          </Text>
          <ActionIcon
            variant="default"
            aria-label="Trang sau"
            disabled={page === pageCount}
            onClick={() => setPage(page + 1)}
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      )}
      <Box ref={ref} style={{ overflow: "auto" }}>
        <Document
          file={url}
          error={loadError}
          loading={
            <Center p="xl">
              <Loader aria-label="Đang tải PDF" />
            </Center>
          }
          onLoadSuccess={({ numPages }) => setPageCount(numPages)}
          externalLinkTarget="_blank"
        >
          {width > 0 && pageCount > 0 && (
            <Page
              pageNumber={page}
              width={Math.min(width, 1000)}
              error={loadError}
              className="mx-auto w-fit"
            />
          )}
        </Document>
      </Box>
    </Box>
  );
}
