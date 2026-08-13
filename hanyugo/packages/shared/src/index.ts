// Shared types between apps/web and apps/api.
// Keeping these in one place means the frontend and backend can never silently
// drift apart on what a "word" or "lesson" looks like.

export interface HskWord {
  id: number;
  hanzi: string;
  pinyin: string; // toned form, e.g. "nǐ hǎo"
  pinyinNumbered: string; // e.g. "ni3 hao3", used to grade typed answers
  meaningEn: string;
  hskLevel: number; // 1-9
  partOfSpeech?: string;
}

export interface Lesson {
  id: number;
  hskLevel: number;
  title: string;
  orderIndex: number;
  words: HskWord[];
}

export type WordStatus = "new" | "learning" | "known" | "marked_for_review";

export interface UserWordProgress {
  wordId: number;
  status: WordStatus;
  correctStreak: number;
  nextReviewAt: string | null;
  note: string | null;
}

export interface HealthResponse {
  ok: boolean;
  service: string;
  timestamp: string;
}
