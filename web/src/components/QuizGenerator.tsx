import { useState } from "react";
import type { Note, QuizResult } from "../App";

interface Props {
  notes: Note[];
  fas: any;
  isSignedIn: boolean;
  onSignIn: () => void;
  onQuizComplete: (result: QuizResult) => void;
}

type QuizType = "multiple-choice" | "true-false" | "fill-blank" | "short-answer";

interface Question {
  type: QuizType;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export function QuizGenerator({ notes, fas, isSignedIn, onSignIn, onQuizComplete }: Props) {
  const [selectedNote, setSelectedNote] = useState<string>("");
  const [quizTypes, setQuizTypes] = useState<QuizType[]>(["multiple-choice"]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"setup" | "quiz" | "results">("setup");

  const toggleType = (t: QuizType) => {
    setQuizTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const generateQuiz = async () => {
    if (!isSignedIn) { onSignIn(); return; }
    if (!selectedNote) { setError("Please select a note."); return; }
    if (quizTypes.length === 0) { setError("Select at least one quiz type."); return; }
    const note = notes.find((n) => n.id === selectedNote);
    if (!note) return;
    setLoading(true);
    setError("");

    try {
      const prompt = `Create ${numQuestions} quiz questions from these study notes.
Question types to use: ${quizTypes.join(", ")}
Mix the types evenly.

Notes: "${note.title}"
${note.content.slice(0, 3000)}

Return a JSON array of question objects. Each object must have:
- type: one of ${quizTypes.map(t => `"${t}"`).join(", ")}
- question: the question text
- answer: the correct answer
- explanation: brief explanation (1-2 sentences)
- options: (for multiple-choice only) array of 4 strings including the correct answer

Return ONLY the JSON array.`;

      const res = await fas.proxy.fetch(
        "api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
          }),
        }
      );
      const json = await res.json() as { choices: { message: { content: string } }[] };
      const raw = json.choices[0].message.content.trim();
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Invalid response format");
      const parsed: Question[] = JSON.parse(match[0]);
      setQuestions(parsed);
      setAnswers({});
      setSubmitted(false);
      setPhase("quiz");
    } catch (e: any) {
      setError(e?.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const note = notes.find((n) => n.id === selectedNote)!;
    let correct = 0;
    questions.forEach((q, i) => {
      const userAns = (answers[i] || "").trim().toLowerCase();
      const correctAns = q.answer.trim().toLowerCase();
      if (
        q.type === "multiple-choice" || q.type === "true-false"
          ? userAns === correctAns
          : correctAns.includes(userAns) || userAns.includes(correctAns.slice(0, 10))
      ) {
        correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    const result: QuizResult = {
      noteId: note.id,
      noteTitle: note.title,
      topics: note.topics || [],
      score,
      correct,
      total: questions.length,
      date: Date.now(),
    };
    onQuizComplete(result);
    setPhase("results");
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

  if (notes.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-6xl mb-4">🧪</div>
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
          No Notes Yet
        </h2>
        <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
          Upload some notes first, then come back to generate a quiz.
        </p>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setPhase("setup")}
            className="text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "var(--line)", color: "var(--ink)" }}
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
            Quiz
          </h1>
        </div>

        <div className="space-y-5">
          {questions.map((q, i) => (
            <div
              key={i}
              className="rounded-2xl p-5"
              style={{ border: "1px solid var(--line)", background: "var(--panel)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                Q{i + 1} · {q.type.replace("-", " ")}
              </p>
              <p className="text-sm font-medium mb-3" style={{ color: "var(--ink)" }}>
                {q.question}
              </p>

              {q.type === "multiple-choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [i]: opt }))}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm transition-all"
                      style={{
                        border: `1px solid ${answers[i] === opt ? "var(--accent)" : "var(--line)"}`,
                        background:
                          submitted
                            ? opt.toLowerCase() === q.answer.toLowerCase()
                              ? "color-mix(in srgb, var(--success) 15%, transparent)"
                              : answers[i] === opt
                              ? "color-mix(in srgb, var(--error) 15%, transparent)"
                              : "var(--paper)"
                            : answers[i] === opt
                            ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                            : "var(--paper)",
                        color: "var(--ink)",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "true-false" && (
                <div className="flex gap-3">
                  {["True", "False"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [i]: opt }))}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                      style={{
                        border: `1px solid ${answers[i] === opt ? "var(--accent)" : "var(--line)"}`,
                        background:
                          submitted
                            ? opt.toLowerCase() === q.answer.toLowerCase()
                              ? "color-mix(in srgb, var(--success) 15%, transparent)"
                              : answers[i] === opt
                              ? "color-mix(in srgb, var(--error) 15%, transparent)"
                              : "var(--paper)"
                            : answers[i] === opt
                            ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                            : "var(--paper)",
                        color: "var(--ink)",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {(q.type === "fill-blank" || q.type === "short-answer") && (
                <input
                  disabled={submitted}
                  value={answers[i] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Your answer…"
                  style={{
                    ...selectStyle,
                    background: submitted ? "var(--paper)" : "var(--paper)",
                  }}
                />
              )}

              {submitted && q.explanation && (
                <div
                  className="mt-3 text-xs px-3 py-2 rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 8%, transparent)",
                    color: "var(--muted)",
                  }}
                >
                  💡 {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {!submitted && (
          <button
            onClick={handleSubmit}
            className="w-full mt-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Submit Quiz
          </button>
        )}
      </div>
    );
  }

  if (phase === "results") {
    const note = notes.find((n) => n.id === selectedNote);
    let correct = 0;
    questions.forEach((q, i) => {
      const userAns = (answers[i] || "").trim().toLowerCase();
      const correctAns = q.answer.trim().toLowerCase();
      if (
        q.type === "multiple-choice" || q.type === "true-false"
          ? userAns === correctAns
          : correctAns.includes(userAns) || userAns.includes(correctAns.slice(0, 10))
      ) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);

    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col items-center text-center">
        <div className="text-6xl mb-4">{score >= 80 ? "🎉" : score >= 60 ? "👍" : "📖"}</div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
          {score >= 80 ? "Excellent!" : score >= 60 ? "Good Work!" : "Keep Studying!"}
        </h1>
        <p className="text-4xl font-bold my-4" style={{ color: "var(--accent)" }}>{score}%</p>
        <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
          {correct} / {questions.length} correct · {note?.title}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => { setPhase("setup"); setQuestions([]); }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--line)", color: "var(--ink)" }}
          >
            New Quiz
          </button>
          <button
            onClick={() => setPhase("quiz")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}
          >
            Review Answers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}>
        Quiz Generator
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Generate a custom quiz from your notes.
      </p>

      <div className="space-y-5">
        {/* Select note */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
            Select Note
          </label>
          <select
            style={selectStyle}
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
          >
            <option value="">— Choose a note —</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>{n.title}</option>
            ))}
          </select>
        </div>

        {/* Quiz types */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
            Question Types
          </label>
          <div className="flex flex-wrap gap-2">
            {(["multiple-choice", "true-false", "fill-blank", "short-answer"] as QuizType[]).map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: quizTypes.includes(t) ? "var(--accent)" : "var(--panel)",
                  color: quizTypes.includes(t) ? "#fff" : "var(--ink)",
                  border: `1px solid ${quizTypes.includes(t) ? "var(--accent)" : "var(--line)"}`,
                }}
              >
                {t.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Num questions */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>
            Number of Questions: {numQuestions}
          </label>
          <input
            type="range"
            min={3}
            max={15}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl" style={{ color: "var(--error)", background: "color-mix(in srgb, var(--error) 10%, transparent)" }}>
            {error}
          </p>
        )}

        <button
          onClick={generateQuiz}
          disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: loading ? "var(--muted)" : "var(--accent)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating…" : "🧪 Generate Quiz"}
        </button>
      </div>
    </div>
  );
}
