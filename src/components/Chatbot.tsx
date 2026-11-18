"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ChatArea, { type ChatMessage } from "@/components/ChatArea";
import Sidebar from "@/components/Sidebar";
import { getAllQuestions, getQuestionById, matchQuestion, type Question } from "@/lib/chatbot";

const questions = getAllQuestions();
const fallback = "معلش يا حبيبتي، المعلومة دي مش موجودة في قاعدة الأسئلة الحالية. اختاري سؤال من المكتبة أو اسأليني عن حاجة تانية من حكايتنا 🤍";
type Theme = "light" | "dark";

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | undefined>(undefined);
  const [pendingReplies, setPendingReplies] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const replyTimers = useRef<Set<number>>(new Set());
  const lastLibrarySelection = useRef<{ id: number; at: number } | undefined>(undefined);

  const selectedQuestion = useMemo(
    () => (selectedQuestionId === undefined ? undefined : getQuestionById(selectedQuestionId)),
    [selectedQuestionId],
  );
  const suggestions = useMemo(() => {
    const categoryOrder = ["memories", "fiance", "future", "personal"];
    return categoryOrder.map((category) => questions.find((question) => question.category === category)).filter((question): question is Question => question !== undefined);
  }, []);

  useEffect(() => {
    const savedTheme = document.documentElement.dataset.theme;
    const initialTheme: Theme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => () => {
    for (const timer of replyTimers.current) window.clearTimeout(timer);
    replyTimers.current.clear();
  }, []);

  const scheduleAnswer = useCallback((question: Question | undefined) => {
    setPendingReplies((count) => count + 1);
    const timer = window.setTimeout(() => {
      const storedQuestion = question ? getQuestionById(question.id) : undefined;
      setMessages((current) => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: storedQuestion?.answer ?? fallback,
        createdAt: new Date(),
        questionId: storedQuestion?.id,
      }]);
      setPendingReplies((count) => Math.max(0, count - 1));
      replyTimers.current.delete(timer);
    }, 520);
    replyTimers.current.add(timer);
  }, []);

  const askQuestion = useCallback((question: Question, displayedQuestion = question.question, fromLibrary = false) => {
    if (fromLibrary) {
      const now = Date.now();
      const previous = lastLibrarySelection.current;
      if (previous?.id === question.id && now - previous.at < 1100) return;
      lastLibrarySelection.current = { id: question.id, at: now };
    }
    setSelectedQuestionId(question.id);
    setMessages((current) => [...current, {
      id: crypto.randomUUID(),
      role: "user",
      content: displayedQuestion,
      createdAt: new Date(),
      questionId: question.id,
    }]);
    scheduleAnswer(question);
  }, [scheduleAnswer]);

  const sendManualQuestion = useCallback((text: string) => {
    const match = matchQuestion(text);
    setSelectedQuestionId(match?.question.id);
    setMessages((current) => [...current, {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date(),
      questionId: match?.question.id,
    }]);
    scheduleAnswer(match?.question);
  }, [scheduleAnswer]);

  const startNewConversation = useCallback(() => {
    for (const timer of replyTimers.current) window.clearTimeout(timer);
    replyTimers.current.clear();
    lastLibrarySelection.current = undefined;
    setMessages([]);
    setSelectedQuestionId(undefined);
    setPendingReplies(0);
    setMobileOpen(false);
  }, []);

  function toggleTheme(): void {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("mohamed-asmaa-theme", nextTheme);
    } catch {
      // The in-memory theme still works if browser storage is unavailable.
    }
  }

  return <main className="app-shell" dir="rtl">
    <Sidebar
      questions={questions}
      selectedQuestionId={selectedQuestionId}
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      theme={theme}
      onToggleCollapsed={() => setCollapsed((value) => !value)}
      onCloseMobile={() => setMobileOpen(false)}
      onSelect={(question) => askQuestion(question, question.question, true)}
      onNewConversation={startNewConversation}
      onToggleTheme={toggleTheme}
    />
    <ChatArea
      messages={messages}
      pendingReplies={pendingReplies}
      selectedQuestion={selectedQuestion}
      suggestions={suggestions}
      onSend={sendManualQuestion}
      onNewConversation={startNewConversation}
      onOpenQuestions={() => setMobileOpen(true)}
    />
  </main>;
}
