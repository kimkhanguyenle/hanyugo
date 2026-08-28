export interface LessonSummary {
  id: number;
  order_index: number;
  title: string;
  hsk_level: number;
}

export interface ApiWord {
  id: number;
  hanzi: string;
  pinyin: string;
  pinyin_numbered: string;
  meaning_en: string;
  hsk_level?: number;
  radical?: string;
  stroke_count?: number;
}

export interface LessonDetail {
  lesson: LessonSummary;
  words: ApiWord[];
}

export interface AuthUser {
  /**
   * UUID from Supabase Auth (auth.users.id).
   * This was a number under the old custom-auth backend; Supabase issues UUIDs,
   * so it is a string now. Nothing in the UI does arithmetic on it.
   */
  id: string;
  email: string;
  display_name?: string | null;
}

export interface ReviewWord extends ApiWord {
  status: "marked_for_review" | "known" | "learning" | "new";
  note?: string;
}

export interface DashboardSummary {
  activeLevel: number;
  streak: number;
  currentLessons: {
    id: number;
    orderIndex: number;
    title: string;
    known: number;
    total: number;
    percent: number;
  }[];
  characterSample: {
    id: number;
    hanzi: string;
    mastered: boolean;
  }[];
  dailyGoal: {
    completed: number;
    target: number;
  };
}
