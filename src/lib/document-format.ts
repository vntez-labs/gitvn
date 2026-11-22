export const documentMimeTypes = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export function getDocumentFormat(path: string) {
  const extension = path.match(/\.(pdf|docx)$/i)?.[1].toLowerCase();
  if (extension === "pdf" || extension === "docx") return extension;
  return null;
}
