import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/app/soaria")({
  head: () => ({
    meta: [
      { title: "Ask Soaria — CareerPilot AI" },
      { name: "description", content: "Talk with Soaria, your AI career coach." },
    ],
  }),
  component: SoariaChat,
});

const STORAGE_KEY = "careerpilot:soaria:messages:v1";

const SUGGESTIONS = [
  "Help me plan the next 90 days of my career.",
  "What careers might match someone who loves writing and psychology?",
  "Coach me through my anxiety about job interviews.",
  "Help me draft the opening line of my CV.",
];

function SoariaChat() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setInitial(raw ? (JSON.parse(raw) as UIMessage[]) : []);
    } catch {
      setInitial([]);
    }
  }, []);

  if (initial === null) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <SoariaChatInner initialMessages={initial} />;
}

function SoariaChatInner({ initialMessages }: { initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    id: "soaria-main",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [status]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  const submit = (text: string) => {
    if (!text.trim() || busy) return;
    void sendMessage({ text: text.trim() });
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
          {isEmpty ? (
            <div className="pt-8 text-center">
              <Logo className="mx-auto h-16 w-16" />
              <h1 className="mt-6 font-display text-3xl font-semibold text-foreground md:text-4xl">
                Hello. I'm <span className="text-gradient-brand">Soaria.</span>
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                I listen before I advise. Tell me where you are, or where you'd like to be — and
                we'll take the next honest step together.
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
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  Something interrupted the reply. Try sending again.
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
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

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
