import { useState, useRef, useEffect } from "react";
import type { Note } from "../App";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  notes: Note[];
  fas: any;
  isSignedIn: boolean;
  onSignIn: () => void;
}

const QUICK_PROMPTS = [
  "Explain this like I'm 10",
  "Give me a real-world example",
  "What's the most important concept?",
  "Create a memory trick for this",
  "What might be on a test?",
  "Summarize in 3 bullet points",
];

export function AITutor({ notes, fas, isSignedIn, onSignIn }: Props) {
  const [selectedNote, setSelectedNote] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedNoteObj = notes.find((n) => n.id === selectedNote);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText) return;
    if (!isSignedIn) { onSignIn(); return; }

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const noteContext = selectedNoteObj
        ? `You are a helpful study tutor. The student is studying: "${selectedNoteObj.title}".
Here are the notes:
${selectedNoteObj.content.slice(0, 3000)}

Key concepts: ${selectedNoteObj.keyConceptsList?.join(", ") || "N/A"}
Topics: ${selectedNoteObj.topics?.join(", ") || "N/A"}

Answer the student's question based on these notes. Be clear, encouraging, and educational.`
        : `You are a helpful study tutor. Answer the student's question clearly and educationally.`;

      const res = await fas.proxy.fetch(
        "api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: noteContext },
              ...newMessages.map((m) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        }
      );
      const json = await res.json() as { choices: { message: { content: string } }[] };
      const reply = json.choices[0].message.content.trim();
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setError(e?.message || "Failed to get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectStyle = {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: "0.75rem",
    color: "var(--ink)",
    padding: "0.625rem 0.875rem",
    width: "100%",
    outline: "none",
    fontFamily: "Manrope, sans-serif",
    fontSize: "0.875rem",
  };

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: "100vh" }}>
      {/* Header */}
      <div className="p-5 border-b shrink-0" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <h1 className="text-xl font-bold mb-3" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
          AI Tutor
        </h1>
        <select
          style={selectStyle}
          value={selectedNote}
          onChange={(e) => setSelectedNote(e.target.value)}
        >
          <option value="">— No note selected (general mode) —</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>{n.title}</option>
          ))}
        </select>
      </div>

      {/* Sign-in gate */}
      {!isSignedIn && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="text-5xl">🤖</div>
          <h2 className="text-lg font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
            Sign in to chat with your AI Tutor
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Ask questions about your notes, get explanations, and study smarter.
          </p>
          <button
            onClick={onSignIn}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Sign in with GitHub
          </button>
        </div>
      )}

      {isSignedIn && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--ink)" }}>
                  Hi! I'm your AI Study Tutor.
                </p>
                <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
                  {selectedNoteObj
                    ? `Ask me anything about "${selectedNoteObj.title}"`
                    : "Select a note above or ask me any study question."}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        border: "1px solid var(--line)",
                        background: "var(--panel)",
                        color: "var(--ink)",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background:
                      msg.role === "user"
                        ? "var(--accent)"
                        : "var(--panel)",
                    color: msg.role === "user" ? "#fff" : "var(--ink)",
                    border: msg.role === "assistant" ? "1px solid var(--line)" : "none",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{ background: "var(--panel)", border: "1px solid var(--line)", color: "var(--muted)" }}
                >
                  Thinking…
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-center px-3 py-2 rounded-xl" style={{ color: "var(--error)", background: "color-mix(in srgb, var(--error) 10%, transparent)" }}>
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="p-4 border-t shrink-0 flex gap-2 items-end"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
              rows={2}
              style={{
                flex: 1,
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "0.75rem",
                color: "var(--ink)",
                padding: "0.625rem 0.875rem",
                outline: "none",
                fontFamily: "Manrope, sans-serif",
                fontSize: "0.875rem",
                resize: "none",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0"
              style={{
                background: loading || !input.trim() ? "var(--muted)" : "var(--accent)",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
