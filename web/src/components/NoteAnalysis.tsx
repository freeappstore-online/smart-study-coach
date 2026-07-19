import { useState } from "react";
import type { Note } from "../App";

interface Props {
  notes: Note[];
  onDelete: (id: string) => void;
}

export function NoteAnalysis({ notes, onDelete }: Props) {
  if (notes.length === 0) {
    return (
      <div
        className="p-6 md:p-8 max-w-3xl mx-auto flex flex-col items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-6xl mb-4">📚</div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
        >
          No Notes Yet
        </h2>
        <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
          Upload or type your notes to see AI analysis here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
      >
        Note Analysis
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        AI-powered breakdown of your study material.
      </p>

      <div className="space-y-6">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function NoteCard({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2
            className="font-bold text-base truncate"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            {note.title}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {new Date(note.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "var(--line)", color: "var(--ink)" }}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(note.id)}
                className="text-xs px-2 py-1.5 rounded-lg font-medium text-white"
                style={{ background: "var(--error)" }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--line)", color: "var(--ink)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-2 py-1.5 rounded-lg font-medium"
              style={{ background: "var(--line)", color: "var(--error)" }}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Summary */}
          {note.summary && (
            <Section title="📋 Summary">
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
                {note.summary}
              </p>
            </Section>
          )}

          {/* Topics */}
          {note.topics?.length > 0 && (
            <Section title="🏷️ Topics">
              <div className="flex flex-wrap gap-2">
                {note.topics.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                      color: "var(--accent)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Key Concepts */}
          {note.keyConceptsList?.length > 0 && (
            <Section title="💡 Key Concepts">
              <ul className="space-y-1">
                {note.keyConceptsList.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--ink)" }}>
                    <span style={{ color: "var(--accent)" }}>•</span>
                    {c}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Definitions */}
          {note.definitions?.length > 0 && (
            <Section title="📖 Definitions">
              <div className="space-y-2">
                {note.definitions.map((d, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold" style={{ color: "var(--ink)" }}>{d.term}: </span>
                    <span style={{ color: "var(--muted)" }}>{d.definition}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Formulas */}
          {note.formulas?.length > 0 && (
            <Section title="🔢 Formulas">
              <div className="space-y-1">
                {note.formulas.map((f, i) => (
                  <div
                    key={i}
                    className="text-sm font-mono px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--paper)", color: "var(--ink)", border: "1px solid var(--line)" }}
                  >
                    {f}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Important Facts */}
          {note.importantFacts?.length > 0 && (
            <Section title="⭐ Important Facts">
              <ul className="space-y-1">
                {note.importantFacts.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--ink)" }}>
                    <span style={{ color: "var(--warning)" }}>★</span>
                    {f}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
