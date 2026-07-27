import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/brand/logo";
import { getDeviceId } from "@/lib/device-id";
import {
  createThread,
  deleteThread,
  getThreadMessages,
  listThreads,
} from "@/lib/chat.functions";
import { restoreThread, withTimeout, STREAM_WATCHDOG_MS } from "@/lib/chat-resilience";
import { toast } from "sonner";

export const Route = createFileRoute("/app/soaria/$threadId")({
  head: () => ({ meta: [{ title: "Ask Soaria — CareerPilot AI" }] }),
  component: SoariaThreadPage,
});

type ThreadRow = { id: string; title: string; updated_at: string };

function SoariaThreadPage() {
  const { threadId } = Route.useParams();
  const [deviceId, setDeviceId] = useState<string>("");
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async (d: string) => {
    setLoadError(null);
    const result = await restoreThread({
      listThreads: () => listThreads({ data: { deviceId: d } }),
      getMessages: () => getThreadMessages({ data: { deviceId: d, threadId } }),
    });
    setThreads(result.threads);
    setInitial(result.messages as unknown as UIMessage[]);
    if (result.status === "error") {
      console.error("[soaria] thread load failed", result.message);
      setLoadError(result.message);
    }
  };


  useEffect(() => {
    const d = getDeviceId();
    setDeviceId(d);
    setInitial(null);
    void load(d);
  }, [threadId]);

  if (!deviceId || initial === null) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-md text-sm text-muted-foreground">{loadError}</p>
        <button
          onClick={() => { setInitial(null); void load(deviceId); }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <ChatBody
      key={threadId}
      threadId={threadId}
      deviceId={deviceId}
      threads={threads}
      setThreads={setThreads}
      initialMessages={initial}
    />
  );
}

const SUGGESTIONS = [
  "Help me plan the next 90 days of my career.",
  "What careers might match someone who loves writing and psychology?",
  "Coach me through my anxiety about job interviews.",
  "Help me draft the opening line of my CV.",
];

function ChatBody({
  threadId,
  deviceId,
  threads,
  setThreads,
  initialMessages,
}: {
  threadId: string;
  deviceId: string;
  threads: ThreadRow[];
  setThreads: (t: ThreadRow[]) => void;
  initialMessages: UIMessage[];
}) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ deviceId, threadId }),
      }),
    [deviceId, threadId],
  );

  const { messages, sendMessage, status, error, stop } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => {
      console.error("[soaria] chat error", err);
      toast.error("Soaria couldn't reply. Please try again.");
    },
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Watchdog: if a request hangs (no bytes / no completion) for 60s, abort it
  // so the UI never spins forever.
  useEffect(() => {
    if (status !== "submitted" && status !== "streaming") return;
    const t = setTimeout(() => {
      console.warn("[soaria] request watchdog aborting after 60s");
      try { stop(); } catch { /* noop */ }
      toast.error("Soaria took too long to respond. Please try again.");
    }, 60000);
    return () => clearTimeout(t);
  }, [status, stop]);

  const busy = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text: text.trim() });
    setInput("");
  };

  const newThread = async () => {
    const t = await createThread({ data: { deviceId } });
    await navigate({ to: "/app/soaria/$threadId", params: { threadId: t.id } });
  };

  const removeThread = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    await deleteThread({ data: { deviceId, id } });
    toast.success("Conversation deleted");
    const rest = threads.filter((t) => t.id !== id);
    setThreads(rest);
    if (id === threadId) {
      if (rest[0]) await navigate({ to: "/app/soaria/$threadId", params: { threadId: rest[0].id } });
      else await newThread();
    }
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-[260px_1fr]">
      <aside className="flex flex-col border-r border-border bg-muted/20">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <button
            onClick={newThread}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {threads.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No conversations yet.</p>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group mb-1 flex items-center gap-1 rounded-lg px-2 py-2 text-sm ${
                t.id === threadId ? "bg-accent/60 text-foreground" : "text-muted-foreground hover:bg-accent/30"
              }`}
            >
              <Link
                to="/app/soaria/$threadId"
                params={{ threadId: t.id }}
                className="flex-1 truncate"
              >
                {t.title}
              </Link>
              <button
                onClick={() => removeThread(t.id)}
                className="opacity-0 transition group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <Link
            to="/app/history"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Search all conversations →
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
            {isEmpty ? (
              <div className="pt-8 text-center">
                <Logo className="mx-auto h-16 w-16" />
                <h1 className="mt-6 font-display text-3xl font-semibold text-foreground md:text-4xl">
                  Hello. I'm <span className="text-gradient-brand">Soaria.</span>
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Tell me where you are, or where you'd like to be — and we'll take the next honest step together.
                </p>
                <div className="mx-auto mt-8 grid max-w-xl gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => submit(s)}
                      className="rounded-xl border border-border bg-card p-4 text-left text-sm text-foreground transition hover:border-accent hover:shadow-elegant"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {messages.map((m) => (
                  <Message key={m.id} message={m} />
                ))}
                {status === "submitted" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                    Soaria is thinking…
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    <span>{error.message || "Something interrupted the reply."}</span>
                    <button
                      onClick={() => submit(messages[messages.length - 1]?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") || "")}
                      className="rounded-md border border-destructive/40 px-2 py-1 text-xs hover:bg-destructive/10"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-background/80 backdrop-blur-xl">
          <form
            className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-4 md:px-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              placeholder="Ask Soaria anything…"
              rows={1}
              className="min-h-[48px] max-h-40 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground shadow-sm outline-none ring-ring/30 focus:ring-2"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-elegant transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <p className="pb-3 text-center text-[11px] text-muted-foreground">
            Soaria offers guidance, not guarantees. For urgent concerns, please seek a qualified professional.
          </p>
        </div>
      </div>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <Logo className="mt-1 h-7 w-7 flex-none" />
      <div className="prose prose-sm max-w-none text-foreground [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_strong]:text-foreground [&_a]:text-primary">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
