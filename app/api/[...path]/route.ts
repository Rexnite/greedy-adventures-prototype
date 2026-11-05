// Private Vercel service bindings must be reached from server functions,
// rather than public edge rewrites.
export const maxDuration = 30;

async function forward(request: Request) {
  const path = new URL(request.url).pathname;
  const expectedMethod: Record<string, string> = {
    "/api/health": "GET",
    "/api/knowledge": "GET",
    "/api/inspect": "POST",
  };
  if (!expectedMethod[path]) return Response.json({ error: "Not found" }, { status: 404 });
  if (request.method !== expectedMethod[path]) return Response.json({ error: "Method not allowed" }, { status: 405 });
  try {
    const body = request.method === "POST" ? await request.text() : undefined;
    if (body && body.length > 100_000) return Response.json({ error: "Request too large" }, { status: 413 });
    const response = await fetch(`${process.env.BACKEND_URL || "http://127.0.0.1:8000"}${path}`, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Knowledge service unavailable" }, { status: 503 });
  }
}

export const GET = forward;
export const POST = forward;
