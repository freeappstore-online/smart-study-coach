import "./app.css";
import { useState, useEffect, useCallback } from "react";
import { initApp } from "@freeappstore/sdk";
import { useAuth } from "@freeappstore/sdk/hooks";
import { Shell } from "./components/Shell";
import { UploadNotes } from "./components/UploadNotes";
import { NoteAnalysis } from "./components/NoteAnalysis";
import { QuizGenerator } from "./components/QuizGenerator";
import { Flashcards } from "./components/Flashcards";
import { AITutor } from "./components/AITutor";
import { Progress } from "./components/Progress";

const fas = initApp({ appId: "smart-study-coach" });

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  summary: string;
  keyConceptsList: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  importantFacts: string[];
  topics: string[];
}

export interface Flashcard {
  id: string;
  noteId: string;
  front: string;
  back: string;
  favorite: boolean;
}

export interface QuizResult {
  noteId: string;
  noteTitle: string;
  topics: string[];
  score: number;
  correct: number;
  total: number;
  date: number;
}

export interface StudyPlan {
  day: string;
  topic: string;
  action: string;
  priority: "high" | "medium" | "low";
}

const STORAGE_KEY = "smartstudy_data";

interface AppData {
  notes: Note[];
  flashcards: Flashcard[];
  quizResults: QuizResult[];
  studyPlan: StudyPlan[];
}

const defaultData: AppData = {
  notes: [],
  flashcards: [],
  quizResults: [],
  studyPlan: [],
};

const NAV = [
  { id: "upload", label: "Upload Notes", icon: "📤" },
  { id: "analysis", label: "Note Analysis", icon: "🔍" },
  { id: "quiz", label: "Quiz Generator", icon: "🧪" },
  { id: "flashcards", label: "Flashcards", icon: "🃏" },
  { id: "tutor", label: "AI Tutor", icon: "🤖" },
  { id: "progress", label: "Progress", icon: "📈" },
];

export default function App() {
  const [active, setActive] = useState("upload");
  const [data, setData] = useState<AppData>(defaultData);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const { user, loading: authLoading } = useAuth(fas);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const handleNoteAdded = useCallback((note: Note) => {
    setData(prev => ({ ...prev, notes: [note, ...prev.notes] }));
    setActive("analysis");
  }, []);

  const handleNoteDelete = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id),
      flashcards: prev.flashcards.filter(f => f.noteId !== id),
    }));
  }, []);

  const handleFlashcardsGenerated = useCallback((noteId: string, cards: Flashcard[]) => {
    setData(prev => ({
      ...prev,
      flashcards: [
        ...prev.flashcards.filter(f => f.noteId !== noteId),
        ...cards,
      ],
    }));
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      flashcards: prev.flashcards.map(f =>
        f.id === id ? { ...f, favorite: !f.favorite } : f
      ),
    }));
  }, []);

  const handleQuizComplete = useCallback((result: QuizResult) => {
    setData(prev => ({ ...prev, quizResults: [result, ...prev.quizResults] }));
    setActive("progress");
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    if (!user) { fas.auth.signIn(); return; }
    setGeneratingPlan(true);
    try {
      const weakTopics = data.quizResults
        .flatMap(r => r.score < 70 ? (r.topics?.length ? r.topics : [r.noteTitle]) : [])
        .slice(0, 5);
      const allTopics = data.notes.flatMap(n => n.topics || []).slice(0, 8);
      const prompt = `Create a 7-day personalized study plan for a student.
Weak topics (score < 70%): ${weakTopics.join(", ") || "none identified yet"}
All study topics: ${allTopics.join(", ") || "general study"}

Return a JSON array of exactly 7 objects, one per day:
[{"day":"Monday","topic":"...","action":"...","priority":"high|medium|low"}]
Priority: high = weak topic, medium = needs review, low = maintenance.
Keep each action under 20 words. Return ONLY the JSON array.`;

      const res = await fas.proxy.fetch(
        "api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        }
      );
      const json = await res.json() as { choices: { message: { content: string } }[] };
      const content = json.choices[0].message.content.trim();
      const match = content.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No JSON array found");
      const plan: StudyPlan[] = JSON.parse(match[0]);
      setData(prev => ({ ...prev, studyPlan: plan }));
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPlan(false);
    }
  }, [fas, user, data.quizResults, data.notes]);

  const isSignedIn = !!user && !authLoading;
  const onSignIn = () => fas.auth.signIn();

  return (
    <Shell nav={NAV} active={active} onNav={setActive}>
      {active === "upload" && (
        <UploadNotes
          onNoteAdded={handleNoteAdded}
          fas={fas}
          isSignedIn={isSignedIn}
          onSignIn={onSignIn}
        />
      )}
      {active === "analysis" && (
        <NoteAnalysis notes={data.notes} onDelete={handleNoteDelete} />
      )}
      {active === "quiz" && (
        <QuizGenerator
          notes={data.notes}
          fas={fas}
          isSignedIn={isSignedIn}
          onSignIn={onSignIn}
          onQuizComplete={handleQuizComplete}
        />
      )}
      {active === "flashcards" && (
        <Flashcards
          notes={data.notes}
          flashcards={data.flashcards}
          fas={fas}
          isSignedIn={isSignedIn}
          onSignIn={onSignIn}
          onFlashcardsGenerated={handleFlashcardsGenerated}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
      {active === "tutor" && (
        <AITutor
          notes={data.notes}
          fas={fas}
          isSignedIn={isSignedIn}
          onSignIn={onSignIn}
        />
      )}
      {active === "progress" && (
        <Progress
          results={data.quizResults}
          studyPlan={data.studyPlan}
          onGeneratePlan={handleGeneratePlan}
          generatingPlan={generatingPlan}
        />
      )}
    </Shell>
  );
}
