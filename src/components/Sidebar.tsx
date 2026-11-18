"use client";

import { useMemo, useState } from "react";
import { normalizeArabic, type Question } from "@/lib/chatbot";
import { Icon } from "@/components/Icons";

export const categoryLabels: Readonly<Record<string, string>> = {
  personal: "معلومات شخصية",
  relationship: "حكايتنا سوا",
  dates: "تواريخ مهمة",
  fiance: "تفاصيل أسماء",
  memories: "ذكرياتنا",
  personality: "شخصيتي",
  feelings: "مشاعر من القلب",
  love_languages: "طرق التعبير عن الحب",
  attraction: "تفاصيل بنحبها",
  conflicts: "وقت الخلاف",
  future: "أحلامنا الجاية",
};

type SidebarProps = {
  questions: Question[];
  selectedQuestionId: number | undefined;
  collapsed: boolean;
  mobileOpen: boolean;
  theme: "light" | "dark";
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onSelect: (question: Question) => void;
  onNewConversation: () => void;
  onToggleTheme: () => void;
};

export default function Sidebar({
  questions,
  selectedQuestionId,
  collapsed,
  mobileOpen,
  theme,
  onToggleCollapsed,
  onCloseMobile,
  onSelect,
  onNewConversation,
  onToggleTheme,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const groups = useMemo(() => {
    const filtered = search.trim()
      ? questions.filter((question) => {
          const term = normalizeArabic(search);
          return normalizeArabic(question.question).includes(term)
            || (question.alternative_questions ?? []).some((item) => normalizeArabic(item).includes(term));
        })
      : questions;
    const grouped = new Map<string, Question[]>();
    for (const question of filtered) {
      const current = grouped.get(question.category) ?? [];
      current.push(question);
      grouped.set(question.category, current);
    }
    return grouped;
  }, [questions, search]);

  return <>
    {mobileOpen && <button type="button" className="sidebar-backdrop" aria-label="إغلاق قائمة الأسئلة" onClick={onCloseMobile} />}
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${mobileOpen ? "sidebar-mobile-open" : ""}`} aria-label="مكتبة الأسئلة">
      <div className="sidebar-brand">
        <span className="brand-mark"><Icon name="heart" size={19} /></span>
        {!collapsed && <span className="brand-name">حكايتنا<span>♥</span></span>}
        <button type="button" className="icon-button sidebar-collapse" onClick={onToggleCollapsed} aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"} aria-expanded={!collapsed} title={collapsed ? "توسيع القائمة" : "طي القائمة"}>
          <span className="collapse-chevron"><Icon name="chevron" size={16} /></span>
        </button>
        <button type="button" className="icon-button sidebar-mobile-close" onClick={onCloseMobile} aria-label="إغلاق القائمة"><Icon name="close" size={17} /></button>
      </div>

      <div className="sidebar-actions">
        <button type="button" className="new-chat-button" onClick={onNewConversation} title="محادثة جديدة">
          <Icon name="plus" size={17} />{!collapsed && <span>محادثة جديدة</span>}
        </button>
        {!collapsed ? <label className="question-search">
          <Icon name="search" size={17} />
          <input aria-label="ابحثي في الأسئلة" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحثي في الأسئلة..." />
          {search && <button type="button" className="clear-search" onClick={() => setSearch("")} aria-label="مسح البحث"><Icon name="close" size={14} /></button>}
        </label> : <button type="button" className="icon-button collapsed-search" onClick={onToggleCollapsed} aria-label="ابحثي في الأسئلة"><Icon name="search" size={18} /></button>}
      </div>

      <div className="question-library">
        {!collapsed && <div className="library-heading"><span>مكتبة الأسئلة</span><span className="question-count">{questions.length}</span></div>}
        {groups.size === 0 ? <div className="empty-search"><span className="empty-search-icon"><Icon name="search" size={20} /></span>{!collapsed && <><strong>مفيش نتائج</strong><p>جرّبي كلمة تانية للبحث.</p></>}</div> : [...groups.entries()].map(([category, items]) => <section className="question-group" key={category} aria-label={categoryLabels[category] ?? category}>
          {!collapsed && <h2 className="category-heading"><span>{categoryLabels[category] ?? category}</span><span>{items.length}</span></h2>}
          {items.map((question) => <button
            type="button"
            key={question.id}
            className={`question-link ${selectedQuestionId === question.id ? "question-link-selected" : ""}`}
            onClick={() => { onSelect(question); onCloseMobile(); }}
            title={collapsed ? question.question : undefined}
            aria-current={selectedQuestionId === question.id ? "true" : undefined}
          >
            <span className="question-link-icon"><Icon name="message" size={15} /></span>
            {!collapsed && <span className="question-link-content"><span>{question.question}</span><small>{categoryLabels[category] ?? category}</small></span>}
          </button>)}
        </section>)}
      </div>

      <div className="sidebar-footer">
        <button type="button" className="theme-button" onClick={onToggleTheme} aria-label={theme === "light" ? "تفعيل الوضع الداكن" : "تفعيل الوضع الفاتح"} title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}>
          <Icon name={theme === "light" ? "moon" : "sun"} size={17} />{!collapsed && <span>{theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}</span>}
        </button>
        {!collapsed && <div className="sidebar-profile"><span className="profile-avatar">م</span><span className="profile-copy"><strong>محمد خليل</strong><small>مساحتنا الخاصة</small></span><Icon className="profile-heart" name="heart" size={16} /></div>}
      </div>
    </aside>
  </>;
}
