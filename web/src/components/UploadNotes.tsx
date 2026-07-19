import { useState, useRef } from "react";
import type { Note } from "../App";

interface Props {
  onNoteAdded: (note: Note) => void;
  fas: any;
  isSignedIn: boolean;
  onSignIn: () => void;
}

export function UploadNotes({ onNoteAdded, fas, isSignedIn, onSignIn }: Props) {
  const [tab, setTab] = useState<"type" | "file">("type");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string ?? "");
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const analyzeContent = async (content: string, noteTitle: string) => {
    if (!isSignedIn) { onSignIn(); return; }
    if (!content.trim()) { setError("Please enter some content."); return; }
    setLoading(true);
    setError("");
    try {
      const prompt = `Analyze these study notes and extract structured information. Return a JSON object with:
- summary: 2-3 sentence overview
- keyConceptsList: array of 5-8 key concepts (strings)
- definitions: array of {term, definition} objects (up to 8)
- formulas: array of formula strings (up to 6, empty array if none)
- importantFacts: array of important facts (up to 8)
- topics: array of 3-5 main topic strings

Notes title: "${noteTitle}"
Notes content:
${content.slice(0, 4000)}

Return ONLY valid JSON, no markdown.`;

      const res = await fas.proxy.fetch(
        "api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
        }
      );
      const json = await res.json() as { choices: { message: { content: string } }[] };
      const raw = json.choices[0].message.content.trim();
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid response format");
      const analysis = JSON.parse(match[0]);

      const note: Note = {
        id: crypto.randomUUID(),
        title: noteTitle || "Untitled Notes",
        content,
        createdAt: Date.now(),
        summary: analysis.summary || "",
        keyConceptsList: analysis.keyConceptsList || [],
        definitions: analysis.definitions || [],
        formulas: analysis.formulas || [],
        importantFacts: analysis.importantFacts || [],
        topics: analysis.topics || [],
      };
      onNoteAdded(note);
      setText("");
      setTitle("");
    } catch (e: any) {
      setError(e?.message || "Failed to analyze notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => analyzeContent(text, title || "My Notes");

  const handleFile = async (file: File) => {
    if (!isSignedIn) { onSignIn(); return; }
    setLoading(true);
    setError("");
    try {
      let content = "";
      const name = file.name.replace(/\.[^.]+$/, "");
      if (
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".md")
      ) {
        content = await readFileAsText(file);
      } else {
        setError("Only .txt and .md files are supported. Please paste your notes instead.");
        setLoading(false);
        return;
      }
      await analyzeContent(content, title || name);
    } catch (e: any) {
      setError(e?.message || "Failed to read file.");
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const inputStyle = {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderRadius: "0.75rem",
    color: "var(--ink)",
    padding: "0.75rem 1rem",
    width: "100%",
    outline: "none",
    fontFamily: "Manrope, sans-serif",
    fontSize: "0.875rem",
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
      >
        Upload Notes
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Add your study material — AI will analyse it instantly.
      </p>

      {!isSignedIn && (
        <div
          className="rounded-2xl p-5 mb-6 flex flex-col items-center gap-3 text-center"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <div className="text-3xl">🔐</div>
          <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            Sign in to use AI features
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            AI analysis, quiz generation, flashcards, and tutoring require a free account.
          </p>
          <button
            onClick={onSignIn}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Sign in with GitHub
          </button>
        </div>
      )}

      {/* Tabs */}
      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        {(["type", "file"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#fff" : "var(--muted)",
            }}
          >
            {t === "type" ? "✏️ Type / Paste" : "📁 Upload File"}
          </button>
        ))}
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
          Note Title (optional)
        </label>
        <input
          style={inputStyle}
          placeholder="e.g. Chapter 5 — Cell Biology"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {tab === "type" ? (
        <div className="mb-5">
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
            Notes Content
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: "220px", resize: "vertical" }}
            placeholder="Paste or type your notes here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
      ) : (
        <div
          className="mb-5 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--line)"}`,
            background: dragOver ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "var(--panel)",
            minHeight: "160px",
            padding: "2rem",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <span className="text-4xl">📄</span>
          <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            Drop a .txt or .md file here
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm mb-4 px-3 py-2 rounded-xl" style={{ color: "var(--error)", background: "color-mix(in srgb, var(--error) 10%, transparent)" }}>
          {error}
        </p>
      )}

      {tab === "type" && (
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: loading || !text.trim() ? "var(--muted)" : "var(--accent)",
            cursor: loading || !text.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analysing…" : "✨ Analyse Notes"}
        </button>
      )}
    </div>
  );
}
