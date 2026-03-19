"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { examSets, type Scenario, type Question, type ExamSet } from "@/data/exam";

type ExamMode = "menu" | "exam" | "review";
type LoginMode = "google" | "email";

interface UserAnswer {
  questionId: number;
  selected: string | null;
}

interface LeaderboardEntry {
  user_name: string;
  user_email: string;
  user_image: string | null;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  exam_set: string;
  time_spent: number;
  created_at: string;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const EXAM_DURATION = 90 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<ExamMode>("menu");
  const [activeSet, setActiveSet] = useState<ExamSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [menuTab, setMenuTab] = useState<"exam" | "panduan" | "leaderboard">("exam");
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("google");
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || userEmail.split("@")[0] || "";
  const userImage = session?.user?.image || "";
  const canStart = status === "authenticated";

  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/scores");
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard:", e);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    if (menuTab === "leaderboard") {
      fetchLeaderboard();
    }
  }, [menuTab, fetchLeaderboard]);

  const startExam = () => {
    if (!canStart) return;
    const randomSet = examSets[Math.floor(Math.random() * examSets.length)];
    setActiveSet(randomSet);
    const allQs = randomSet.scenarios.flatMap((s) => s.questions);
    const finalQs = shuffleQuestions ? shuffleArray(allQs) : [...allQs];
    setQuestions(finalQs);
    setAnswers(finalQs.map((q) => ({ questionId: q.id, selected: null })));
    setCurrentIndex(0);
    setShowExplanation(false);
    setExamFinished(false);
    setScoreSubmitted(false);
    setTimeLeft(EXAM_DURATION);
    setMode("exam");
  };

  useEffect(() => {
    if (mode === "exam" && !examFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, examFinished]);

  useEffect(() => {
    if (mode === "exam" && !examFinished && timeLeft === 0) {
      finishExam();
    }
  }, [timeLeft, mode, examFinished]);

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamFinished(true);
  };

  const submitScore = useCallback(async (scoreVal: number, correctVal: number, totalVal: number, passedVal: boolean, examSetName: string, timeSpentVal: number) => {
    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scoreVal,
          correct: correctVal,
          total: totalVal,
          passed: passedVal,
          examSet: examSetName,
          timeSpent: timeSpentVal,
        }),
      });
      setScoreSubmitted(true);
    } catch (e) {
      console.error("Failed to submit score:", e);
    }
  }, []);

  const selectAnswer = (label: string) => {
    if (showExplanation) return;
    setAnswers((prev) =>
      prev.map((a, i) =>
        i === currentIndex ? { ...a, selected: label } : a
      )
    );
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    } else {
      finishExam();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setShowExplanation(answers[prevIndex].selected !== null);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
    setShowExplanation(answers[index].selected !== null);
  };

  const getScenarioForQuestion = useCallback(
    (questionId: number): Scenario | undefined => {
      if (!activeSet) return undefined;
      return activeSet.scenarios.find((s) =>
        s.questions.some((q) => q.id === questionId)
      );
    },
    [activeSet]
  );

  const score = useMemo(() => {
    const correct = answers.filter((a, i) => {
      return a.selected === questions[i]?.correctAnswer;
    }).length;
    return { correct, total: questions.length };
  }, [answers, questions]);

  const answeredCount = answers.filter((a) => a.selected !== null).length;
  const timeSpent = EXAM_DURATION - timeLeft;

  // Menu
  if (mode === "menu") {
    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-slate-800">
            CCA Practice Exam
          </h1>
          <p className="text-lg text-slate-500">
            AI Architect Foundations (Claude-inspired)
          </p>
          <p className="text-sm text-slate-400 mt-1">60 Questions | 90 Minutes | Passing Score: 720/1000</p>
          <p className="text-xs text-slate-400 mt-1">{examSets.length} exam sets &bull; {examSets.length * 60} total questions</p>
        </div>

        {/* Tab Navigation */}
        <div className="w-full max-w-md mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setMenuTab("exam")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                menuTab === "exam"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Exam
            </button>
            <button
              onClick={() => setMenuTab("leaderboard")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                menuTab === "leaderboard"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setMenuTab("panduan")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                menuTab === "panduan"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Panduan
            </button>
          </div>
        </div>

        {menuTab === "exam" ? (
        <div className="w-full max-w-md space-y-4">
          {/* Google Sign In */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Candidate Information</h3>
            {status === "loading" ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-slate-500">Loading...</span>
              </div>
            ) : session ? (
              <div className="flex items-center gap-4">
                {userImage ? (
                  <img src={userImage} alt="" className="w-12 h-12 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-600">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-400 truncate">{userEmail}</p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Login mode tabs */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setLoginMode("google")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                      loginMode === "google" ? "bg-blue-50 text-blue-600" : "bg-white text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Google
                  </button>
                  <button
                    onClick={() => setLoginMode("email")}
                    className={`flex-1 py-2 text-xs font-semibold transition-colors border-l border-slate-200 ${
                      loginMode === "email" ? "bg-blue-50 text-blue-600" : "bg-white text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Email
                  </button>
                </div>

                {loginMode === "google" ? (
                  <button
                    onClick={() => signIn("google")}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-medium text-slate-700">Sign in with Google</span>
                  </button>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!emailInput.trim()) return;
                      setEmailLoading(true);
                      await signIn("email-only", {
                        email: emailInput.trim(),
                        name: nameInput.trim() || emailInput.trim().split("@")[0],
                        redirect: false,
                      });
                      setEmailLoading(false);
                    }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      placeholder="Name (optional)"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={emailLoading || !emailInput.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      {emailLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Continue with Email</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Exam info */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>60 multiple choice questions (A-D)</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>90 minutes time limit</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Random exam set from {examSets.length} question banks</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Passing score: 720/1000</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => setShuffleQuestions(!shuffleQuestions)}>
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  shuffleQuestions ? "border-blue-500 bg-blue-500" : "border-slate-300"
                }`}
              >
                {shuffleQuestions && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-slate-700 text-sm">Shuffle question order</span>
            </label>
          </div>

          <button
            onClick={startExam}
            disabled={!canStart}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors text-lg"
          >
            {status === "authenticated" ? "Start Practice Exam" : "Sign in to Start"}
          </button>
        </div>
        ) : menuTab === "leaderboard" ? (
        <div className="w-full max-w-md space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Top Scores</h3>
              <button
                onClick={fetchLeaderboard}
                className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
            {loadingLeaderboard ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-slate-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-24 mb-1" />
                      <div className="h-2 bg-slate-100 rounded w-16" />
                    </div>
                    <div className="h-4 bg-slate-200 rounded w-12" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm text-slate-400">No scores yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const isMe = session?.user?.email === entry.user_email;
                  const rankBg = i === 0 ? "bg-yellow-400 text-yellow-900" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-500";
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isMe ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankBg}`}>
                        {i + 1}
                      </span>
                      {entry.user_image ? (
                        <img src={entry.user_image} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-600">{entry.user_name?.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {entry.user_name}
                          {isMe && <span className="text-xs text-blue-500 ml-1">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-bold ${entry.passed ? "text-green-600" : "text-red-500"}`}>
                          {entry.score}
                        </span>
                        <p className="text-xs text-slate-400">{entry.correct}/{entry.total}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        entry.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}>
                        {entry.passed ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Study Materials</h3>
            <div className="space-y-3">
              <a
                href="/CCA-Exam-Guide.pdf"
                download
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">CCA Exam Guide</div>
                  <div className="text-xs text-slate-400">Official exam overview, domains &amp; objectives</div>
                </div>
              </a>
              <a
                href="/Architects-Playbook.pdf"
                download
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">The Architect&apos;s Playbook</div>
                  <div className="text-xs text-slate-400">Architecture patterns, best practices &amp; strategies</div>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Vibe Coding SDLC Bible</h3>
            <p className="text-xs text-slate-400 mb-4">Seri lengkap panduan Software Development Life Cycle dengan AI</p>
            <div className="space-y-3">
              {[
                { part: 1, title: "Requirements & Planning", desc: "Cara mengumpulkan requirements dan merencanakan proyek dengan bantuan AI", slug: "requirements" },
                { part: 2, title: "Design & Architecture", desc: "Merancang arsitektur sistem dan design patterns menggunakan AI assistant", slug: "design" },
                { part: 3, title: "Implementation: Vibe Coding in Action", desc: "Praktik langsung coding dengan AI — dari prompt engineering hingga pair programming", slug: "implementation" },
                { part: 4, title: "Testing & QA", desc: "Strategi testing komprehensif dengan AI untuk quality assurance yang lebih baik", slug: "testing" },
                { part: 5, title: "Deployment & DevOps", desc: "CI/CD, infrastructure as code, dan deployment strategies dengan bantuan AI", slug: "deployment" },
                { part: 6, title: "Maintenance & Iteration (FINALE)", desc: "Maintenance, monitoring, dan iterasi berkelanjutan — penutup seri SDLC Bible", slug: "maintenance" },
              ].map((item) => (
                <a
                  key={item.part}
                  href={`https://jekardah.com/vibe-coding-sdlc-bible-part${item.part}-${item.slug}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-600">{item.part}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                    <div className="text-xs text-slate-400 truncate">{item.desc}</div>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Exam Domains</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <span>Claude Model Capabilities &amp; Selection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <span>Prompt Engineering &amp; Optimization</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <span>API Integration &amp; Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-bold flex items-center justify-center shrink-0">4</span>
                <span>Agentic &amp; Tool Use Patterns</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-bold flex items-center justify-center shrink-0">5</span>
                <span>Safety, Security &amp; Responsible AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded text-xs font-bold flex items-center justify-center shrink-0">6</span>
                <span>Performance, Cost &amp; Scaling</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center mt-8 max-w-md leading-relaxed">
          This is an independent practice platform and is not affiliated with, endorsed by, or sponsored by Anthropic. Claude is a trademark of Anthropic.
        </p>
      </div>
    );
  }

  // Results
  if (examFinished) {
    const percentage = Math.round((score.correct / score.total) * 1000);
    const passed = percentage >= 720;

    // Submit score once
    if (!scoreSubmitted && session) {
      submitScore(percentage, score.correct, score.total, passed, activeSet?.name || "", timeSpent);
    }

    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        {/* User card */}
        <div className="bg-white rounded-xl p-6 mt-8 mb-6 border border-slate-200 shadow-sm text-center">
          {userImage ? (
            <img src={userImage} alt="" className="w-16 h-16 rounded-full mx-auto mb-3" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-blue-600">
                {userName.trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-800">{userName}</h2>
          <p className="text-sm text-slate-500">{userEmail}</p>
          {activeSet && (
            <p className="text-xs text-slate-400 mt-1">{activeSet.name}</p>
          )}
        </div>

        <div className="text-center mb-8">
          <div
            className={`inline-block px-6 py-2 rounded-full text-sm font-semibold mb-4 ${
              passed
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {passed ? "PASSED" : "NOT PASSED"}
          </div>
          <div className="text-6xl font-bold mb-2 text-slate-800">
            {percentage}/1000
          </div>
          <p className="text-slate-500 text-lg">
            {score.correct} of {score.total} correct
          </p>
          <p className="text-slate-400 mt-1">
            Time: {formatTime(timeSpent)} / {formatTime(EXAM_DURATION)}
          </p>
          {scoreSubmitted && (
            <p className="text-xs text-green-500 mt-2">Score saved to leaderboard</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            Score by Scenario
          </h2>
          <div className="space-y-3">
            {activeSet?.scenarios.map((s) => {
              const scenarioQs = questions.filter((q) =>
                s.questions.some((sq) => sq.id === q.id)
              );
              const scenarioCorrect = scenarioQs.filter((q) => {
                const answerEntry = answers.find((a) => a.questionId === q.id);
                return answerEntry?.selected === q.correctAnswer;
              }).length;
              const pct =
                scenarioQs.length > 0
                  ? Math.round((scenarioCorrect / scenarioQs.length) * 100)
                  : 0;

              return (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-700">{s.title}</span>
                      <span className="text-sm text-slate-500">
                        {scenarioCorrect}/{scenarioQs.length}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct >= 72 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setMode("review");
              setCurrentIndex(0);
              setShowExplanation(true);
            }}
            className="flex-1 py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl transition-colors"
          >
            Review Answers
          </button>
          <button
            onClick={() => setMode("menu")}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            New Exam
          </button>
        </div>
      </div>
    );
  }

  // Exam / Review
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const scenario = getScenarioForQuestion(currentQuestion.id);
  const isReview = mode === "review";
  const isTimeLow = timeLeft <= 300;

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            if (isReview) {
              setMode("exam");
            } else {
              setMode("menu");
              if (timerRef.current) clearInterval(timerRef.current);
            }
          }}
          className="text-slate-400 hover:text-slate-700 transition-colors text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isReview ? "Back to Results" : "Exit"}
        </button>

        {!isReview && (
          <div
            className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1 rounded-lg ${
              isTimeLow ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTime(timeLeft)}
          </div>
        )}

        <div className="text-sm text-slate-500">
          {answeredCount}/{questions.length} answered
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full mb-6">
        <div
          className="h-1.5 bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {questions.map((q, i) => {
          const a = answers[i];
          let bg = "bg-slate-200 text-slate-600";
          if (a.selected !== null) {
            if (isReview) {
              bg = a.selected === q.correctAnswer ? "bg-green-500 text-white" : "bg-red-500 text-white";
            } else {
              bg = "bg-blue-500 text-white";
            }
          }
          return (
            <button
              key={i}
              onClick={() => goToQuestion(i)}
              className={`w-8 h-8 rounded text-xs font-medium transition-all ${bg} ${
                i === currentIndex ? "ring-2 ring-blue-500 ring-offset-1 ring-offset-white" : ""
              } hover:opacity-80`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {scenario && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
            Scenario {scenario.id}: {scenario.title}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm mb-4">
        <div className="flex items-start gap-3 mb-6">
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-lg shrink-0">
            {currentIndex + 1}
          </span>
          <p className="text-slate-800 text-base leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((opt) => {
            let optionClass =
              "border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer";

            if (showExplanation || isReview) {
              if (opt.label === currentQuestion.correctAnswer) {
                optionClass = "border-green-400 bg-green-50 text-green-800";
              } else if (opt.label === currentAnswer?.selected) {
                optionClass = "border-red-400 bg-red-50 text-red-800";
              } else {
                optionClass = "border-slate-100 bg-slate-50/50 text-slate-400";
              }
            } else if (currentAnswer?.selected === opt.label) {
              optionClass = "border-blue-400 bg-blue-50 text-slate-800";
            }

            return (
              <button
                key={opt.label}
                onClick={() => selectAnswer(opt.label)}
                disabled={showExplanation || isReview}
                className={`w-full text-left p-4 rounded-lg border transition-all ${optionClass}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`font-bold text-sm shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      showExplanation || isReview
                        ? opt.label === currentQuestion.correctAnswer
                          ? "bg-green-500 text-white"
                          : opt.label === currentAnswer?.selected
                          ? "bg-red-500 text-white"
                          : "bg-slate-200 text-slate-400"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="text-sm leading-relaxed">{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {(showExplanation || isReview) && (
        <div
          className={`rounded-xl p-5 mb-4 border ${
            currentAnswer?.selected == null
              ? "bg-amber-50 border-amber-200"
              : currentAnswer.selected === currentQuestion.correctAnswer
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {currentAnswer?.selected == null ? (
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : currentAnswer.selected === currentQuestion.correctAnswer ? (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span
              className={`font-semibold text-sm ${
                currentAnswer?.selected == null
                  ? "text-amber-600"
                  : currentAnswer.selected === currentQuestion.correctAnswer ? "text-green-700" : "text-red-700"
              }`}
            >
              {currentAnswer?.selected == null
                ? `Not Answered - Correct Answer: ${currentQuestion.correctAnswer}`
                : currentAnswer.selected === currentQuestion.correctAnswer
                ? "Correct!"
                : `Incorrect - Answer: ${currentQuestion.correctAnswer}`}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={prevQuestion}
          disabled={currentIndex === 0}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 disabled:opacity-30 disabled:hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
        >
          Previous
        </button>
        <button
          onClick={nextQuestion}
          disabled={!showExplanation && !isReview}
          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
        >
          {currentIndex === questions.length - 1
            ? isReview
              ? "Back to Results"
              : "Finish Exam"
            : "Next Question"}
        </button>
      </div>
    </div>
  );
}
