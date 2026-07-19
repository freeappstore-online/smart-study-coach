import type { QuizResult, StudyPlan } from "../App";

interface Props {
  results: QuizResult[];
  studyPlan: StudyPlan[];
  onGeneratePlan: () => void;
  generatingPlan: boolean;
}

export function Progress({ results, studyPlan, onGeneratePlan, generatingPlan }: Props) {
  // Aggregate topic scores
  const topicMap: Record<string, { total: number; count: number }> = {};
  results.forEach((r) => {
    const topics = r.topics?.length ? r.topics : [r.noteTitle];
    topics.forEach((t) => {
      if (!topicMap[t]) topicMap[t] = { total: 0, count: 0 };
      topicMap[t].total += r.score;
      topicMap[t].count += 1;
    });
  });

  const topicScores = Object.entries(topicMap)
    .map(([topic, { total, count }]) => ({ topic, score: Math.round(total / count) }))
    .sort((a, b) => a.score - b.score);

  const overallAvg = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const weakTopics = topicScores.filter((t) => t.score < 70);
  const strongTopics = topicScores.filter((t) => t.score >= 70);

  const priorityColor = (p: StudyPlan["priority"]) => {
    if (p === "high") return "var(--error)";
    if (p === "medium") return "var(--warning)";
    return "var(--success)";
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <h1
        className="text-2xl font-bold mb-1"
        style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
      >
        Progress & Study Plan
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Track your performance and get a personalised plan.
      </p>

      {results.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <div className="text-5xl mb-3">📈</div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ fontFamily: "Fraunces, serif", color: "var(--ink)" }}
          >
            No Quiz Results Yet
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Complete a quiz to see your progress here.
          </p>
        </div>
      ) : (
        <>
          {/* Overall score */}
          <div
            className="rounded-2xl p-5 mb-5 flex items-center gap-5"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
              style={{
                background:
                  overallAvg >= 80
                    ? "var(--success)"
                    : overallAvg >= 60
                    ? "var(--warning)"
                    : "var(--error)",
              }}
            >
              {overallAvg}%
            </div>
            <div>
              <p className="font-semibold text-base" style={{ color: "var(--ink)" }}>
                Overall Average
              </p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {results.length} quiz{results.length !== 1 ? "zes" : ""} completed
              </p>
            </div>
          </div>

          {/* Topic breakdown */}
          {topicScores.length > 0 && (
            <div
              className="rounded-2xl p-5 mb-5"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              <h2
                className="font-semibold text-sm mb-4"
                style={{ color: "var(--ink)" }}
              >
                Topic Performance
              </h2>
              <div className="space-y-3">
                {topicScores.map(({ topic, score }) => (
                  <div key={topic}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--ink)" }}>
                      <span className="truncate max-w-[70%]">{topic}</span>
                      <span className="font-semibold">{score}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--line)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${score}%`,
                          background:
                            score >= 80
                              ? "var(--success)"
                              : score >= 60
                              ? "var(--warning)"
                              : "var(--error)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak / Strong */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {weakTopics.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: "color-mix(in srgb, var(--error) 8%, var(--panel))", border: "1px solid var(--line)" }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--error)" }}>
                  ⚠️ Needs Work
                </h3>
                <ul className="space-y-1">
                  {weakTopics.map(({ topic, score }) => (
                    <li key={topic} className="text-xs flex justify-between" style={{ color: "var(--ink)" }}>
                      <span className="truncate max-w-[75%]">{topic}</span>
                      <span className="font-semibold">{score}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {strongTopics.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: "color-mix(in srgb, var(--success) 8%, var(--panel))", border: "1px solid var(--line)" }}
              >
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--success)" }}>
                  ✅ Strong Areas
                </h3>
                <ul className="space-y-1">
                  {strongTopics.map(({ topic, score }) => (
                    <li key={topic} className="text-xs flex justify-between" style={{ color: "var(--ink)" }}>
                      <span className="truncate max-w-[75%]">{topic}</span>
                      <span className="font-semibold">{score}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Recent results */}
          <div
            className="rounded-2xl p-5 mb-5"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--ink)" }}>
              Recent Quizzes
            </h2>
            <div className="space-y-2">
              {results.slice(0, 5).map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-2"
                  style={{ borderBottom: i < Math.min(results.length, 5) - 1 ? "1px solid var(--line)" : "none" }}
                >
                  <div>
                    <p className="font-medium truncate max-w-[200px]" style={{ color: "var(--ink)" }}>{r.noteTitle}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(r.date).toLocaleDateString()} · {r.correct}/{r.total} correct
                    </p>
                  </div>
                  <span
                    className="font-bold text-sm"
                    style={{
                      color:
                        r.score >= 80
                          ? "var(--success)"
                          : r.score >= 60
                          ? "var(--warning)"
                          : "var(--error)",
                    }}
                  >
                    {r.score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Study Plan */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
            📅 7-Day Study Plan
          </h2>
          <button
            onClick={onGeneratePlan}
            disabled={generatingPlan}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
            style={{
              background: generatingPlan ? "var(--muted)" : "var(--accent)",
              cursor: generatingPlan ? "not-allowed" : "pointer",
            }}
          >
            {generatingPlan ? "Generating…" : "✨ Generate Plan"}
          </button>
        </div>

        {studyPlan.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
            Click "Generate Plan" to get a personalised 7-day study schedule.
          </p>
        ) : (
          <div className="space-y-2">
            {studyPlan.map((day, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: priorityColor(day.priority) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold" style={{ color: "var(--ink)" }}>{day.day}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{
                      background: `color-mix(in srgb, ${priorityColor(day.priority)} 12%, transparent)`,
                      color: priorityColor(day.priority),
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}>
                      {day.priority}
                    </span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>{day.topic}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{day.action}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
