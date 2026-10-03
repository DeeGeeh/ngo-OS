import { getDashboard } from "@/server/data/facade";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const refresh = new URL(request.url).searchParams.get("refresh");
  try {
    return Response.json(
      await getDashboard(id, { refresh: refresh === "force" ? "force" : "due" }),
    );
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "The dashboard could not be read.",
      {
        status: 404,
      },
    );
  }
}
