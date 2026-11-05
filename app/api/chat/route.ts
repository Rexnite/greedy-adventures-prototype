// Local models can need longer than a rewrite proxy's socket timeout.
// Keep the backend private and allow its bounded inference request to finish.
export const maxDuration = 150;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 100_000) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const key = request.headers.get("x-gemini-api-key");
    if (key) {
      if (key.length > 256 || !/^[A-Za-z0-9_-]+$/.test(key)) {
        return Response.json({ error: "Invalid API key format" }, { status: 400 });
      }
      headers["x-gemini-api-key"] = key;
    }
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/chat`,
      {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(125_000)]),
        cache: "no-store",
      },
    );
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Concierge connection unavailable" }, { status: 503 });
  }
}
