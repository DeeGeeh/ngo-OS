import { addSourceSchema } from "@/lib/data";
import { addSource, getDataLibrary } from "@/server/data/facade";

export async function GET() {
  return Response.json(await getDataLibrary());
}

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.includes("application/json")) {
    const body: unknown = await request.json().catch(() => null);
    try {
      return Response.json(await addSource(addSourceSchema.parse(body)), { status: 201 });
    } catch (error) {
      return new Response(
        error instanceof Error ? error.message : "The source could not be imported.",
        {
          status: 400,
        },
      );
    }
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const id = form?.get("id");
  if (!(file instanceof File) || (id !== null && typeof id !== "string")) {
    return new Response("Upload a CSV file.", { status: 400 });
  }
  try {
    const source = await addSource({
      kind: "csv-upload",
      file,
      ...(id ? { id } : {}),
    });
    return Response.json(source, { status: 201 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "The CSV could not be imported.", {
      status: 400,
    });
  }
}
