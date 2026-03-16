"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { examSets, type Scenario, type Question, type ExamSet } from "@/data/exam";

type ExamMode = "menu" | "exam" | "review";

interface UserAnswer {
  questionId: number;
  selected: string | null;
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
  const [mode, setMode] = useState<ExamMode>("menu");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [activeSet, setActiveSet] = useState<ExamSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const canStart = userName.trim().length > 0 && userEmail.trim().length > 0;

  const startExam = () => {
    if (!canStart) return;
    // Pick a random exam set
    const randomSet = examSets[Math.floor(Math.random() * examSets.length)];
    setActiveSet(randomSet);
    const allQs = randomSet.scenarios.flatMap((s) => s.questions);
    const finalQs = shuffleQuestions ? shuffleArray(allQs) : [...allQs];
    setQuestions(finalQs);
    setAnswers(finalQs.map((q) => ({ questionId: q.id, selected: null })));
    setCurrentIndex(0);
    setShowExplanation(false);
    setExamFinished(false);
    setTimeLeft(EXAM_DURATION);
    setMode("exam");
  };

  useEffect(() => {
    if (mode === "exam" && !examFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setExamFinished(true);
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

  const finishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamFinished(true);
  };

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
      setCurrentIndex(currentIndex - 1);
      setShowExplanation(true);
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
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 text-slate-800">
            CCA Practice Exam
          </h1>
          <p className="text-lg text-slate-500">
            Claude Certified Architect &mdash; Foundations
          </p>
          <p className="text-sm text-slate-400 mt-1">60 Questions | 90 Minutes | Passing Score: 720/1000</p>
          <p className="text-xs text-slate-400 mt-1">{examSets.length} exam sets &bull; {examSets.length * 60} total questions</p>
        </div>

        <div className="w-full max-w-md space-y-4">
          {/* User info form */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Candidate Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
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
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  // Results
  if (examFinished) {
    const percentage = Math.round((score.correct / score.total) * 1000);
    const passed = percentage >= 720;

    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        {/* User card */}
        <div className="bg-white rounded-xl p-6 mt-8 mb-6 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-blue-600">
              {userName.trim().charAt(0).toUpperCase()}
            </span>
          </div>
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
              setExamFinished(true);
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
            if (isReview || (showExplanation && i <= currentIndex)) {
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
            currentAnswer?.selected === currentQuestion.correctAnswer
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {currentAnswer?.selected === currentQuestion.correctAnswer ? (
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
                currentAnswer?.selected === currentQuestion.correctAnswer ? "text-green-700" : "text-red-700"
              }`}
            >
              {currentAnswer?.selected === currentQuestion.correctAnswer
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
