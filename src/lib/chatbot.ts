import sourceData from "@/data/mohamed_asmaa_chatbot_qa.json";

export type Question = {
  id: number;
  question: string;
  answer: string;
  category: string;
  alternative_questions?: string[];
};

type KnowledgeData = {
  metadata: {
    title: string;
    language: string;
    total_questions: number;
    version: string;
    note: string;
  };
  questions: Question[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isQuestion(value: unknown): value is Question {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "number" &&
    typeof value.question === "string" &&
    typeof value.answer === "string" &&
    typeof value.category === "string" &&
    (value.alternative_questions === undefined ||
      (Array.isArray(value.alternative_questions) && value.alternative_questions.every((entry: unknown) => typeof entry === "string")))
  );
}

function parseKnowledgeData(value: unknown): KnowledgeData {
  if (!isRecord(value) || !isRecord(value.metadata) || !Array.isArray(value.questions)) {
    throw new Error("ملف قاعدة الأسئلة غير صالح: تأكدي من وجود metadata ومصفوفة questions.");
  }
  const metadata = value.metadata;
  if (
    typeof metadata.title !== "string" ||
    typeof metadata.language !== "string" ||
    typeof metadata.total_questions !== "number" ||
    typeof metadata.version !== "string" ||
    typeof metadata.note !== "string"
  ) {
    throw new Error("ملف قاعدة الأسئلة غير صالح: بيانات metadata غير مكتملة.");
  }
  if (!value.questions.every(isQuestion)) {
    throw new Error("ملف قاعدة الأسئلة غير صالح: يوجد سؤال أو إجابة بتنسيق غير مكتمل.");
  }
  return { metadata: metadata as KnowledgeData["metadata"], questions: value.questions };
}

const knowledgeData = parseKnowledgeData(sourceData);

export const knowledgeMetadata = knowledgeData.metadata;

export function getAllQuestions(): Question[] {
  return knowledgeData.questions;
}

export function getQuestionsByCategory(): Map<string, Question[]> {
  const grouped = new Map<string, Question[]>();
  for (const question of knowledgeData.questions) {
    const questions = grouped.get(question.category) ?? [];
    questions.push(question);
    grouped.set(question.category, questions);
  }
  return grouped;
}

export function getQuestionById(id: number): Question | undefined {
  return knowledgeData.questions.find((question) => question.id === id);
}

export function searchQuestions(searchTerm: string): Question[] {
  const normalizedTerm = normalizeArabic(searchTerm);
  if (!normalizedTerm) return getAllQuestions();
  return knowledgeData.questions.filter((question) => {
    const searchable = [question.question, question.category, ...(question.alternative_questions ?? [])]
      .map(normalizeArabic)
      .join(" ");
    return searchable.includes(normalizedTerm);
  });
}

/** Removes tashkeel, normalizes common Arabic letter variants, and strips punctuation. */
export function normalizeArabic(value: string): string {
  return value
    .toLocaleLowerCase("ar")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ـ\u200e\u200f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCharacterBigrams(value: string): Set<string> {
  const compact = value.replace(/\s/g, "");
  const bigrams = new Set<string>();
  for (let index = 0; index < compact.length - 1; index += 1) {
    bigrams.add(compact.slice(index, index + 2));
  }
  return bigrams;
}

function similarity(query: string, candidate: string): number {
  if (!query || !candidate) return 0;
  if (query === candidate) return 1;
  if (candidate.includes(query) || query.includes(candidate)) {
    const shorter = Math.min(query.length, candidate.length);
    const longer = Math.max(query.length, candidate.length);
    if (shorter / longer >= 0.48) return 0.88 + (shorter / longer) * 0.1;
  }

  const queryTokens = new Set(query.split(" ").filter(Boolean));
  const candidateTokens = new Set(candidate.split(" ").filter(Boolean));
  const commonTokens = [...queryTokens].filter((token) => candidateTokens.has(token)).length;
  const tokenDice = (2 * commonTokens) / Math.max(queryTokens.size + candidateTokens.size, 1);
  const tokenCoverage = commonTokens / Math.max(Math.min(queryTokens.size, candidateTokens.size), 1);

  const queryBigrams = getCharacterBigrams(query);
  const candidateBigrams = getCharacterBigrams(candidate);
  const commonBigrams = [...queryBigrams].filter((bigram) => candidateBigrams.has(bigram)).length;
  const bigramDice = (2 * commonBigrams) / Math.max(queryBigrams.size + candidateBigrams.size, 1);

  return tokenDice * 0.45 + tokenCoverage * 0.2 + bigramDice * 0.35;
}

export type QuestionMatch = { question: Question; score: number };

export function matchQuestion(query: string): QuestionMatch | undefined {
  const normalizedQuery = normalizeArabic(query);
  if (!normalizedQuery) return undefined;

  let best: QuestionMatch | undefined;
  for (const question of knowledgeData.questions) {
    const candidates = [question.question, ...(question.alternative_questions ?? [])];
    const score = Math.max(...candidates.map((candidate) => similarity(normalizedQuery, normalizeArabic(candidate))));
    if (!best || score > best.score) best = { question, score };
  }

  return best && best.score >= 0.32 ? best : undefined;
}
