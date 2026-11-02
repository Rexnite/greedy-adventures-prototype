"use client";
import { useRef, useEffect } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  useAuiState,
  useAui,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import {
  ArrowUp,
  ArrowUpRight,
  X,
  Sparkles,
  FileText,
  Download,
} from "lucide-react";
type Media = {
  id: string;
  title: string;
  type: "pdf" | "video";
  url: string;
  official: boolean;
};
type ResponseData = {
  text: string;
  mode: string;
  media: Media[];
  citations: { id: string; title: string; url: string }[];
  trace: unknown;
};
const adapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    const turns = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content
          .filter((p) => p.type === "text")
          .map((p) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .slice(0, 6000),
      }));
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: turns.at(-1)?.content,
          history: turns.slice(0, -1).slice(-12),
        }),
        signal: abortSignal,
      });
      if (!response.ok) throw new Error("Service error");
      const data: ResponseData = await response.json();
      return {
        content: [{ type: "text", text: data.text }],
        metadata: { custom: { response: data } },
      };
    } catch (error) {
      if (abortSignal.aborted) throw error;
      return {
        content: [
          {
            type: "text",
            text: "The concierge connection is unavailable. Please try again. You can also visit the official experience page.",
          },
        ],
        metadata: {
          custom: {
            response: { mode: "unavailable", media: [], citations: [] },
          },
        },
      };
    }
  },
};
function AssistantMessage() {
  const result = useAuiState((s) => s.message.metadata.custom.response) as
    ResponseData | undefined;
  return (
    <MessagePrimitive.Root className="assistant-message">
      <span className="message-label">
        <Sparkles size={12} /> GREEDY CONCIERGE{" "}
        {result?.mode === "mock"
          ? "· MOCK MODE"
          : result?.mode === "unavailable"
            ? "· SERVICE UNAVAILABLE"
            : ""}
      </span>
      <div className="message-text">
        <MessagePrimitive.Parts />
      </div>
      {result?.media?.map((m) => (
        <div key={m.id} className="media-card">
          {m.type === "pdf" ? (
            <>
              <div className="pdf-icon">
                <FileText size={24} />
                <span>PDF</span>
              </div>
              <strong>{m.title}</strong>
              <small>DEMO — NOT AN OFFICIAL DOCUMENT</small>
              <div className="media-actions">
                <a href={m.url} target="_blank" rel="noreferrer">
                  Open PDF <ArrowUpRight size={14} />
                </a>
                <a href={m.url} download>
                  Download <Download size={14} />
                </a>
              </div>
            </>
          ) : (
            <>
              <strong>{m.title}</strong>
              <video
                src={m.url}
                controls
                playsInline
                preload="none"
                poster="/media/hero.jpg"
                aria-label="Official skydiving film"
              />
              <a href={m.url} target="_blank" rel="noreferrer">
                Watch official video ↗
              </a>
            </>
          )}
        </div>
      ))}
      {!!result?.citations?.length && (
        <div className="citations">
          Sources:{" "}
          {result.citations.map((c) => (
            <a href={c.url} target="_blank" rel="noreferrer" key={c.id}>
              {c.title} ↗
            </a>
          ))}
        </div>
      )}
    </MessagePrimitive.Root>
  );
}
function UserMessage() {
  return (
    <MessagePrimitive.Root className="user-message">
      <MessagePrimitive.Parts />
    </MessagePrimitive.Root>
  );
}
function Prompts() {
  const aui = useAui();
  return (
    <div className="prompt-chips">
      {[
        ["Compare packages", "Compare packages"],
        ["Get the brochure", "Send me a brochure"],
        ["Watch the jump", "Show me a clip"],
        ["Send both", "Send the brochure and video"],
      ].map(([label, text]) => (
        <button
          key={label}
          onClick={() =>
            aui
              .thread()
              .append({ role: "user", content: [{ type: "text", text }] })
          }
        >
          {label} <ArrowUpRight size={13} />
        </button>
      ))}
    </div>
  );
}
export function Concierge({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const runtime = useLocalRuntime(adapter);
  const panel = useRef<HTMLDivElement>(null),
    launcher = useRef<HTMLElement | null>(null),
    wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      launcher.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      panel.current?.querySelector("textarea")?.focus();
    } else if (wasOpen.current) launcher.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div
        ref={panel}
        id="concierge"
        className="chat-panel"
        hidden={!open}
        role="region"
        aria-label="Adventure concierge"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onOpenChange(false);
            launcher.current?.focus();
          }
        }}
      >
        <div className="chat-header">
          <div>
            <span className="eyebrow">A LITTLE GUIDANCE</span>
            <h2>
              Your adventure concierge<span>.</span>
            </h2>
          </div>
          <button
            aria-label="Close concierge"
            onClick={() => {
              onOpenChange(false);
              launcher.current?.focus();
            }}
          >
            <X size={20} />
          </button>
        </div>
        <ThreadPrimitive.Root className="chat-thread">
          <ThreadPrimitive.Viewport className="chat-viewport">
            <ThreadPrimitive.Empty>
              <div className="chat-welcome">
                <Sparkles size={30} />
                <h3>Ready for the leap?</h3>
                <p>
                  I can help you explore packages, compare experiences, or share
                  a brochure and video.
                </p>
                <small>
                  AI answers require configured model access. Media requests
                  work independently.
                </small>
              </div>
            </ThreadPrimitive.Empty>
            <Prompts />
            <ThreadPrimitive.Messages
              components={{ UserMessage, AssistantMessage }}
            />
            <ThreadPrimitive.If running>
              <p role="status" className="chat-loading">
                Checking your adventure…
              </p>
            </ThreadPrimitive.If>
          </ThreadPrimitive.Viewport>
          <ComposerPrimitive.Root className="chat-composer">
            <ComposerPrimitive.Input
              placeholder="Ask about your next adventure…"
              aria-label="Message the concierge"
              rows={1}
            />
            <ComposerPrimitive.Send aria-label="Send message">
              <ArrowUp size={19} />
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
          <p className="chat-disclaimer">
            Source-grounded guidance · No bookings or payments
          </p>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}
