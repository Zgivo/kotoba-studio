export type LessonId = string;
export type VocabularyId = string;
export type JapaneseScriptType = 'kanji' | 'hiragana' | 'katakana' | 'mixed';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'mastered';
export type QuizMode = 'japanese-to-romaji' | 'romaji-to-japanese' | 'english-to-japanese' | 'mixed';
export type InterfaceLanguage = 'ru' | 'en' | 'ja';
export type InterfaceTheme = 'light' | 'dark';

export interface Lesson {
  id: LessonId;
  title: string;
  description?: string;
  order: number;
  color?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyEntry {
  id: VocabularyId;
  lessonId: LessonId;
  japanese: string;
  romaji: string;
  englishMeaning: string;
  russianMeaning?: string;
  japaneseMeaning?: string;
  acceptedRomaji: string[];
  scriptType: JapaneseScriptType;
  categoryIds: string[];
  hint?: string;
  exampleJapanese?: string;
  exampleRomaji?: string;
  exampleEnglish?: string;
  exampleRussian?: string;
  exampleJapaneseMeaning?: string;
  notes?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface VocabularyProgress {
  vocabularyId: VocabularyId;
  shownCount: number;
  correctCount: number;
  incorrectCount: number;
  currentStreak: number;
  bestStreak: number;
  lastReviewedAt?: string;
  lastResult?: 'correct' | 'incorrect';
  masteryLevel: MasteryLevel;
  recentResults: boolean[];
}

export interface SessionConfiguration {
  lessonIds: LessonId[];
  categoryIds: string[];
  quizMode: QuizMode;
  questionCount: number | 'all';
  vocabularyFilter: 'all' | 'new' | 'learning' | 'mastered' | 'mistakes';
  shuffleQuestions: boolean;
}

export interface SessionAnswer {
  questionId: string;
  vocabularyId: VocabularyId;
  direction: Exclude<QuizMode, 'mixed'>;
  submittedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface LearningSession {
  id: string;
  configuration: SessionConfiguration;
  vocabularyIds: VocabularyId[];
  directions: Exclude<QuizMode, 'mixed'>[];
  answers: SessionAnswer[];
  currentQuestionIndex: number;
  startedAt: string;
  completedAt?: string;
}

export interface Settings {
  dailyGoal: number;
  soundEnabled: boolean;
  reducedMotion: boolean;
  interfaceLanguage: InterfaceLanguage;
  interfaceTheme: InterfaceTheme;
}

export interface AppSnapshot {
  contentVersion?: number;
  lessons: Lesson[];
  vocabulary: VocabularyEntry[];
  categories: VocabularyCategory[];
  progress: VocabularyProgress[];
  sessions: LearningSession[];
  currentSession: LearningSession | null;
  settings: Settings;
  initialized: boolean;
}

export interface ExportEnvelope<T> {
  schemaVersion: number;
  exportedAt: string;
  applicationVersion: string;
  data: T;
}
