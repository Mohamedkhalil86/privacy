"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/chatbot";
import { categoryLabels } from "@/components/Sidebar";
import { Icon } from "@/components/Icons";

export type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  createdAt: Date;
  questionId?: number;
};

type ChatAreaProps = {
  messages: ChatMessage[];
  pendingReplies: number;
  selectedQuestion: Question | undefined;
  suggestions: Question[];
  onSend: (text: string) => void;
  onNewConversation: () => void;
  onOpenQuestions: () => void;
};

export default function ChatArea({ messages, pendingReplies, selectedQuestion, suggestions, onSend, onNewConversation, onOpenQuestions }: ChatAreaProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingReplies]);

  return <section className="chat-panel" aria-label="محادثتنا">
    <header className="chat-header">
      <button type="button" className="icon-button mobile-menu-button" onClick={onOpenQuestions} aria-label="العودة إلى قائمة الأسئلة"><Icon name="menu" size={20} /></button>
      <div className="assistant-avatar"><Icon name="heart" size={19} /><span /></div>
      <div className="chat-header-copy"><h1>اسألي محمد</h1><p><span className="online-dot" />متاح للرد عليكي دائماً ❤️</p></div>
      {selectedQuestion && <span className="active-category">{categoryLabels[selectedQuestion.category] ?? selectedQuestion.category}</span>}
      <button type="button" className="header-new-chat" onClick={onNewConversation} aria-label="محادثة جديدة"><Icon name="plus" size={17} /><span>محادثة جديدة</span></button>
    </header>

    <div className="messages-scroll" ref={feedRef} role="log" aria-live="polite" aria-label="رسائل المحادثة">
      {messages.length === 0 ? <WelcomeScreen suggestions={suggestions} onAsk={onSend} /> : <div className="messages-list">
        <div className="conversation-date"><span>بداية حكاية حلوة</span></div>
        {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
        {pendingReplies > 0 && <TypingIndicator />}
      </div>}
    </div>

    <ChatInput onSend={onSend} disabled={pendingReplies > 0} />
  </section>;
}

function WelcomeScreen({ suggestions, onAsk }: { suggestions: Question[]; onAsk: (text: string) => void }) {
  return <div className="welcome-screen">
    <span className="welcome-icon"><Icon name="sparkles" size={25} /></span>
    <span className="eyebrow">مساحتنا الخاصة</span>
    <h2>أهلاً يا أجمل حكاياتي <span>🤍</span></h2>
    <p className="welcome-description">أنا محمد، وهنا جمعتلك إجابات عني وعننا وعن كل التفاصيل اللي بتهمنا. اختاري سؤال من المكتبة أو اسأليني بطريقتك.</p>
    <div className="welcome-divider"><span /><Icon name="heart" size={13} /><span /></div>
    <div className="suggestion-heading"><span>ممكن نبدأ بإيه؟</span><small>أسئلة من حكايتنا</small></div>
    <div className="suggestion-grid">
      {suggestions.map((question) => <button type="button" key={question.id} className="suggestion-card" onClick={() => onAsk(question.question)}>
        <span className="suggestion-card-icon"><Icon name="message" size={15} /></span><span>{question.question}</span><Icon className="suggestion-chevron" name="chevron" size={15} />
      </button>)}
    </div>
  </div>;
}

function ChatMessage({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);

  async function copyAnswer(): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return <article className={`message-row ${message.role === "user" ? "message-user" : "message-assistant"}`}>
    {message.role === "assistant" && <span className="message-avatar"><Icon name="heart" size={13} /></span>}
    <div className="message-content-wrap">
      <div className={`message-bubble ${message.role === "user" ? "user-bubble" : "assistant-bubble"}`} dir="rtl">{message.content}</div>
      <div className="message-meta">
        <time dateTime={message.createdAt.toISOString()}>{new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit" }).format(message.createdAt)}</time>
        {message.role === "assistant" && <button type="button" className="copy-button" onClick={() => void copyAnswer()} aria-label={copied ? "تم نسخ الإجابة" : "نسخ الإجابة"} title={copied ? "تم النسخ" : "نسخ الإجابة"}><Icon name={copied ? "check" : "copy"} size={13} />{copied && <span>اتنسخت</span>}</button>}
      </div>
    </div>
    {message.role === "user" && <span className="user-avatar" aria-hidden="true">أ</span>}
  </article>;
}

function TypingIndicator() {
  return <div className="message-row message-assistant typing-row" aria-label="محمد بيكتبلك"><span className="message-avatar"><Icon name="heart" size={13} /></span><div className="typing-bubble"><span /><span /><span /></div></div>;
}

function ChatInput({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function send(): void {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  return <div className="chat-input-area">
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="chat-message-input">اكتبي سؤالك هنا</label>
      <textarea ref={textareaRef} id="chat-message-input" value={value} onChange={(event) => {
        setValue(event.target.value);
        event.target.style.height = "auto";
        event.target.style.height = `${Math.min(event.target.scrollHeight, 136)}px`;
      }} onKeyDown={handleKeyDown} rows={1} maxLength={1000} placeholder="اكتبي سؤالك هنا يا ست البنات..." />
      <button type="submit" disabled={!value.trim() || disabled} className="send-button" aria-label="إرسال الرسالة"><Icon name="send" size={17} /></button>
    </form>
    <p className="input-hint">اضغطي <kbd>Enter</kbd> للإرسال <span>·</span> <kbd>Shift + Enter</kbd> لسطر جديد</p>
  </div>;
}
