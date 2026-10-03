"use server";

import { importGoogleSource } from "@/server/data/facade";

type ImportState =
  | { kind: "idle" }
  | { kind: "success"; name: string }
  | { kind: "error"; message: string };

export async function importGoogleSourceAction(
  _previous: ImportState,
  formData: FormData,
): Promise<ImportState> {
  try {
    const source = await importGoogleSource(formData.get("url"));
    return { kind: "success", name: source.name };
  } catch {
    return {
      kind: "error",
      message: "The file could not be imported. Check the URL and your Google access.",
    };
  }
}
