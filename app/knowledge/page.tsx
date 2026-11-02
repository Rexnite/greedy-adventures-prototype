"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
type Passage = {
  id: string;
  heading: string;
  text: string;
  url: string;
  score?: number;
};
type Knowledge = {
  source: {
    id: string;
    title: string;
    url: string;
    captured_at: string;
    text: string;
  };
  passages: Passage[];
  media: {
    id: string;
    title: string;
    type: string;
    url: string;
    source_url: string;
    official: boolean;
    status: string;
    attribution: string;
  }[];
};
type Trace = {
  question: string;
  intent: string;
  selected_media_ids: string[];
  retrieved_passage_ids: string[];
  model_context: Passage[];
  model_called: boolean;
};
export default function KnowledgePage() {
  const [data, setData] = useState<Knowledge | null>(null),
    [question, setQuestion] = useState("Send the brochure and video"),
    [trace, setTrace] = useState<Trace | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/knowledge", { signal: controller.signal })
      .then((r) => {
        if (!r.ok)
          throw Error(
            "Knowledge service is unavailable. Start the Python backend and retry.",
          );
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  async function test(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTrace(null);
    try {
      const r = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      if (!r.ok)
        throw Error("Retrieval service unavailable. Please try again.");
      setTrace(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="knowledge">
      <Link href="/" className="text-link">
        <ArrowLeft size={15} /> Back to the experience
      </Link>
      <h1>
        Behind the answers<span style={{ color: "var(--orange)" }}>.</span>
      </h1>
      <p>
        A read-only view of the public knowledge and media used by the
        concierge. No API keys or stored conversations. The test below runs the
        same Python routing and BM25 retrieval as chat; it does not call the
        model.
      </p>
      {error && (
        <p role="alert" style={{ color: "#a33c20", marginTop: 20 }}>
          {error}
        </p>
      )}
      <section>
        <h2>Test the retrieval</h2>
        <form onSubmit={test}>
          <input
            aria-label="Test question"
            value={question}
            maxLength={2000}
            required
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="button orange" disabled={loading}>
            {loading ? "Retrieving…" : "Inspect question"}{" "}
            <ArrowUpRight size={16} />
          </button>
        </form>
        {trace && (
          <div aria-live="polite">
            <p>
              <b>Intent:</b> {trace.intent} · <b>Media:</b>{" "}
              {trace.selected_media_ids.join(", ") || "None"}
            </p>
            <h2>Exact retrieved model context</h2>
            <p>
              This is the context selected by the shared chat pipeline for this
              question. Media requests bypass the model. Model called:{" "}
              {String(trace.model_called)}.
            </p>
            {trace.model_context.length ? (
              trace.model_context.map((p) => (
                <details open key={p.id}>
                  <summary>
                    {p.id} · {p.heading} · BM25 {p.score}
                  </summary>
                  <pre>{p.text}</pre>
                  <a href={p.url} target="_blank" rel="noreferrer">
                    Original source ↗
                  </a>
                </details>
              ))
            ) : (
              <p>No relevant passages found.</p>
            )}
            <details>
              <summary>Full response trace</summary>
              <pre>{JSON.stringify(trace, null, 2)}</pre>
            </details>
          </div>
        )}
      </section>
      {data ? (
        <>
          <section>
            <span className="eyebrow dark">
              PUBLIC SOURCE / {data.source.id}
            </span>
            <h2>{data.source.title}</h2>
            <p>
              <a href={data.source.url} target="_blank" rel="noreferrer">
                Open original source ↗
              </a>
            </p>
            <small>
              Captured: {new Date(data.source.captured_at).toUTCString()} ·{" "}
              {data.passages.length} meaningful passages
            </small>
            <details>
              <summary>Full extracted source text</summary>
              <pre>{data.source.text}</pre>
            </details>
            {data.passages.map((p) => (
              <details key={p.id}>
                <summary>
                  {p.id} · {p.heading}
                </summary>
                <pre>{p.text}</pre>
              </details>
            ))}
          </section>
          <section>
            <h2>Media registry</h2>
            {data.media.map((m) => (
              <article key={m.id}>
                <h3>{m.title}</h3>
                <p>
                  {m.id} · {m.type.toUpperCase()} ·{" "}
                  {m.official ? "Official" : "Demo — not an official document"}{" "}
                  · {m.status}
                </p>
                <p>{m.attribution}</p>
                <a href={m.url} target="_blank" rel="noreferrer">
                  Open asset ↗
                </a>{" "}
                ·{" "}
                <a href={m.source_url} target="_blank" rel="noreferrer">
                  Source ↗
                </a>
                <hr
                  style={{
                    border: 0,
                    borderTop: "1px solid #d4d8d1",
                    margin: "22px 0",
                  }}
                />
              </article>
            ))}
          </section>
        </>
      ) : (
        !error && (
          <p role="status" style={{ marginTop: 25 }}>
            Loading public knowledge…
          </p>
        )
      )}
    </main>
  );
}
