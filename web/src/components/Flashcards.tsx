import { useState, useCallback } from "react";
import type { Note, Flashcard } from "../App";

interface Props {
  notes: Note[];
  flashcards: Flashcard[];
  fas: any;
  isSignedIn: boolean;
  onSignIn: () => void;
  onFlashcardsGenerated: (noteId: string, cards: Flashcard[]) => void;
  onToggleFavorite: (id: string) => void;
}

export function Flashcards({
  notes,
  flashcards,
  fas,
  isSignedIn,
  onSignIn,
  onFlashcardsGenerated,
  onToggleFavorite,
}: Props) {
  const [selectedNote, setSelectedNote] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"generate" | "study">("generate");
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterFav, setFilterFav] = useState(false);

  const generateFlashcards = useCallback(async () => {
    if (!isSignedIn) { onSignIn(); return; }
    if (!selectedNote) { setError("Select a note first."); return; }
    const note = notes.find((n) => n.id === selectedNote);
    if (!note) return;
    setLoading(true);
    setError("");
    try {
      const prompt = `Create 10 high-quality flashcards from these study notes.
Return a JSON array of objects with:
- front: the question or term (concise, max 15 words)
- back: the answer or definition (clear, max 40 words)

Cover key concepts, definitions, formulas, and important facts.
Notes: "${note.title}"
${note.content.slice(0, 3000)}

Return ONLY the JSON array.`;

      const res = await fas.proxy.fetch(
        "api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.4,
          }),
        }
      );
      const json = await res.json() as { choices: { message: { content: string } }[] };
      const raw = json.choices[0].message.content.trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Invalid response format");
      const parsed: { front: string; back: string }[] = JSON.parse(match[0]);
      const cards: Flashcard[] = parsed.map((c) => ({
        id: crypto.randomUUID(),
        noteId: note.id,
        front: c.front,
        back: c.back,
        favorite: false,
      }));
      onFlashcardsGenerated(note.id, cards);
      setStudyCards(cards);
      setCurrentIndex(0);
      setFlipped(false);
      setMode("study");
    } catch (e: any) {
      setError(e?.message || "Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fas, isSignedIn, onSignIn, selectedNote, notes, onFlashcardsGenerated]);

  const startStudying = (noteId?: string) => {
    const cards = noteId
      ? flashcards.filter((f) => f.noteId === noteId)
      : flashcards;
    const filtered = filterFav ? cards.filter((f) => f.favorite) : cards;
    if (filtered.length === 0) { setError("No flashcards to study."); return; }
    setStudyCards(filtered);
    setCurrentIndex(0);
    setFlipped(false);
    setMode("study");
    setError("");
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

  if (mode === "study" && studyCards.length > 0) {
    const card = studyCards[currentIndex];
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setMode("generate")}
            className="text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "var(--line)", color: "var(--ink)" }}
          >
            ← Back
          </button>
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {currentIndex + 1} / {studyCards.length}
          </span>
          <button
            onClick={() => onToggleFavorite(card.id)}
            className="text-xl"
            title="Favourite"
          >
            {card.favorite ? "⭐" : "☆"}
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full mb-6" style={{ background: "var(--line)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / studyCards.length) * 100}%`,
              background: "var(--accent)",
            }}
          />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl cursor-pointer select-none flex flex-col items-center justify-center text-center p-8 transition-all"
          style={{
            border: "1px solid var(--line)",
            background: flipped
              ? "color-mix(in srgb, var(--accent) 8%, var(--panel))"
              : "var(--panel)",
            minHeight: "240px",
          }}
          onClick={() => setFlipped((v) => !v)}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--muted)" }}>
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="text-base font-medium leading-relaxed" style={{ color: "var(--ink)" }}>
            {flipped ? card.back : card.front}
          </p>
          <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>
            {flipped ? "Tap to see question" : "Tap to reveal answer"}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { setCurrentIndex((i) => Math.max(0, i - 1)); setFlipped(false); }}
            disabled={currentIndex === 0}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: "var(--line)",
              color: currentIndex === 0 ? "var(--muted)" : "var(--ink)",
            }}
          >
            ← Prev
          </button>
          <button
            onClick={() => { setCurrentIndex((i) => Math.min(studyCards.length - 1, i + 1)); setFlipped(false); }}
            disabled={currentIndex === studyCards.length - 1}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: currentIndex === studyCards.length - 1 ? "var(--muted)" : "var(--accent)",
            }}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
      >
        Flashcards
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Generate AI flashcards from your notes and study them.
      </p>

      {/* Generate section */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
      >
        <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--ink)" }}>
          ✨ Generate New Flashcards
        </h2>
        <select
          style={selectStyle}
          value={selectedNote}
          onChange={(e) => setSelectedNote(e.target.value)}
          className="mb-3"
        >
          <option value="">— Choose a note —</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>{n.title}</option>
          ))}
        </select>
        {error && (
          <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "var(--error)", background: "color-mix(in srgb, var(--error) 10%, transparent)" }}>
            {error}
          </p>
        )}
        <button
          onClick={generateFlashcards}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: loading ? "var(--muted)" : "var(--accent)", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? "Generating…" : "🃏 Generate Flashcards"}
        </button>
      </div>

      {/* Existing flashcard sets */}
      {flashcards.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
              Your Flashcard Sets
            </h2>
            <button
              onClick={() => setFilterFav((v) => !v)}
              className="text-xs px-2.5 py-1 rounded-lg"
              style={{
                background: filterFav ? "var(--accent)" : "var(--line)",
                color: filterFav ? "#fff" : "var(--muted)",
              }}
            >
              ⭐ Favourites only
            </button>
          </div>

          {/* All cards button */}
          <button
            onClick={() => startStudying()}
            className="w-full mb-3 py-2.5 rounded-xl text-sm font-medium text-left px-4"
            style={{ border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}
          >
            📚 All flashcards ({flashcards.length} cards)
          </button>

          {/* Per-note */}
          {notes
            .filter((n) => flashcards.some((f) => f.noteId === n.id))
            .map((n) => {
              const count = flashcards.filter((f) => f.noteId === n.id).length;
              const favCount = flashcards.filter((f) => f.noteId === n.id && f.favorite).length;
              return (
                <button
                  key={n.id}
                  onClick={() => startStudying(n.id)}
                  className="w-full mb-2 py-3 rounded-xl text-sm font-medium text-left px-4 flex items-center justify-between"
                  style={{ border: "1px solid var(--line)", background: "var(--panel)", color: "var(--ink)" }}
                >
                  <span className="truncate">{n.title}</span>
                  <span className="shrink-0 text-xs ml-2" style={{ color: "var(--muted)" }}>
                    {count} cards · {favCount} ⭐
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {flashcards.length === 0 && notes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🃏</div>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Upload notes first, then generate flashcards here.
          </p>
        </div>
      )}
    </div>
  );
}
