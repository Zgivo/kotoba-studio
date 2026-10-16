import { z } from 'zod';

export const lessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  color: z.string().optional(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const vocabularySchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  japanese: z.string().trim().min(1),
  romaji: z.string().trim().min(1),
  englishMeaning: z.string().trim().min(1),
  russianMeaning: z.string().trim().min(1).optional(),
  japaneseMeaning: z.string().trim().min(1).optional(),
  acceptedRomaji: z.array(z.string()),
  scriptType: z.enum(['kanji', 'hiragana', 'katakana', 'mixed']),
  categoryIds: z.array(z.string()),
  hint: z.string().optional(),
  exampleJapanese: z.string().optional(),
  exampleRomaji: z.string().optional(),
  exampleEnglish: z.string().optional(),
  exampleRussian: z.string().optional(),
  exampleJapaneseMeaning: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const progressSchema = z.object({
  vocabularyId: z.string(),
  shownCount: z.number().int().nonnegative(),
  correctCount: z.number().int().nonnegative(),
  incorrectCount: z.number().int().nonnegative(),
  currentStreak: z.number().int().nonnegative(),
  bestStreak: z.number().int().nonnegative(),
  lastReviewedAt: z.string().optional(),
  lastResult: z.enum(['correct', 'incorrect']).optional(),
  masteryLevel: z.enum(['new', 'learning', 'familiar', 'mastered']),
  recentResults: z.array(z.boolean()),
});

const sessionConfigurationSchema = z.object({
  lessonIds: z.array(z.string()),
  categoryIds: z.array(z.string()),
  quizMode: z.enum(['japanese-to-romaji', 'romaji-to-japanese', 'english-to-japanese', 'mixed']),
  questionCount: z.union([z.number().int().positive(), z.literal('all')]),
  vocabularyFilter: z.enum(['all', 'new', 'learning', 'mastered', 'mistakes']),
  shuffleQuestions: z.boolean(),
});

const answerSchema = z.object({
  questionId: z.string(),
  vocabularyId: z.string(),
  direction: z.enum(['japanese-to-romaji', 'romaji-to-japanese', 'english-to-japanese']),
  submittedAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  answeredAt: z.string(),
});
const sessionSchema = z.object({
  id: z.string(),
  configuration: sessionConfigurationSchema,
  vocabularyIds: z.array(z.string()),
  directions: z.array(z.enum(['japanese-to-romaji', 'romaji-to-japanese', 'english-to-japanese'])),
  answers: z.array(answerSchema),
  currentQuestionIndex: z.number().int().nonnegative(),
  startedAt: z.string(),
  completedAt: z.string().optional(),
});
const settingsSchema = z.object({
  dailyGoal: z.number().int().positive(),
  soundEnabled: z.boolean(),
  reducedMotion: z.boolean(),
  interfaceLanguage: z.enum(['ru', 'en', 'ja']).optional(),
  interfaceTheme: z.enum(['light', 'dark']).optional(),
});

export const importEnvelopeSchema = z.object({
  schemaVersion: z.number().int().min(1).max(1),
  exportedAt: z.string(),
  applicationVersion: z.string(),
  data: z.object({
    lessons: z.array(lessonSchema),
    vocabulary: z.array(vocabularySchema),
    categories: z.array(
      z.object({ id: z.string(), name: z.string(), description: z.string().optional(), color: z.string().optional() }),
    ),
    progress: z.array(progressSchema).optional(),
    sessions: z.array(sessionSchema).optional(),
    currentSession: sessionSchema.nullable().optional(),
    settings: settingsSchema.optional(),
  }),
});
