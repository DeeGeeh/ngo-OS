"use client";

import { generateId, type AttachmentAdapter } from "@assistant-ui/react";

import { sourceSummarySchema } from "@/lib/data";

export const csvAttachmentAdapter = {
  accept: ".csv,text/csv,application/csv",
  async add({ file }: { file: File }) {
    return {
      id: generateId(),
      type: "document",
      name: file.name,
      contentType: file.type || "text/csv",
      file,
      status: { type: "requires-action", reason: "composer-send" },
    };
  },
  async send(attachment, options) {
    if (options?.signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
    const form = new FormData();
    form.set("file", attachment.file);
    form.set("id", attachment.id);
    const response = await fetch("/api/data/sources", {
      method: "POST",
      body: form,
      signal: options?.signal,
    });
    if (!response.ok) throw new Error(await response.text());
    const source = sourceSummarySchema.parse(await response.json());
    return {
      ...attachment,
      status: { type: "complete" },
      content: [
        {
          type: "data" as const,
          name: "source",
          data: source,
        },
      ],
    };
  },
  async remove() {},
} satisfies AttachmentAdapter;
