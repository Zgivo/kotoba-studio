import type {
  LearningSession,
  MasteryLevel,
  QuizMode,
  SessionConfiguration,
  VocabularyEntry,
  VocabularyProgress,
} from './types';

export const masteryPolicy = {
  minimumAttempts: 2,
  familiarAccuracy: 0.7,
  masteredAccuracy: 0.8,
  masteredRecentCorrectAnswers: 3,
};

export function calculateMastery(progress: VocabularyProgress): MasteryLevel {
  if (progress.shownCount === 0) return 'new';
  const accuracy = progress.correctCount / progress.shownCount;
  const recent = progress.recentResults.slice(-masteryPolicy.masteredRecentCorrectAnswers);
  if (
    progress.shownCount >= masteryPolicy.masteredRecentCorrectAnswers &&
    accuracy >= masteryPolicy.masteredAccuracy &&
    recent.length === masteryPolicy.masteredRecentCorrectAnswers &&
    recent.every(Boolean)
  )
    return 'mastered';
  if (progress.shownCount >= masteryPolicy.minimumAttempts && accuracy >= masteryPolicy.familiarAccuracy)
    return 'familiar';
  return 'learning';
}

export function updateProgress(
  previous: VocabularyProgress | undefined,
  vocabularyId: string,
  correct: boolean,
): VocabularyProgress {
  const next: VocabularyProgress = previous
    ? structuredClone(previous)
    : {
        vocabularyId,
        shownCount: 0,
        correctCount: 0,
        incorrectCount: 0,
        currentStreak: 0,
        bestStreak: 0,
        masteryLevel: 'new',
        recentResults: [],
      };
  next.shownCount += 1;
  if (correct) {
    next.correctCount += 1;
    next.currentStreak += 1;
  } else {
    next.incorrectCount += 1;
    next.currentStreak = 0;
  }
  next.bestStreak = Math.max(next.bestStreak, next.currentStreak);
  next.lastReviewedAt = new Date().toISOString();
  next.lastResult = correct ? 'correct' : 'incorrect';
  next.recentResults = [...next.recentResults, correct].slice(-8);
  next.masteryLevel = calculateMastery(next);
  return next;
}

export function filterVocabulary(
  entries: VocabularyEntry[],
  progress: VocabularyProgress[],
  config: SessionConfiguration,
): VocabularyEntry[] {
  const map = new Map(progress.map((item) => [item.vocabularyId, item]));
  return entries.filter((entry) => {
    if (entry.status !== 'published') return false;
    if (config.lessonIds.length && !config.lessonIds.includes(entry.lessonId)) return false;
    if (config.categoryIds.length && !config.categoryIds.some((id) => entry.categoryIds.includes(id))) return false;
    const current = map.get(entry.id);
    const mastery = current ? calculateMastery(current) : 'new';
    if (config.vocabularyFilter === 'new') return mastery === 'new';
    if (config.vocabularyFilter === 'learning') return mastery === 'learning';
    if (config.vocabularyFilter === 'mastered') return mastery === 'mastered';
    if (config.vocabularyFilter === 'mistakes')
      return current?.lastResult === 'incorrect' || Boolean(current?.incorrectCount);
    return true;
  });
}

function localDayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function countAnswersForLocalDay(
  sessions: LearningSession[],
  currentSession: LearningSession | null,
  day: Date = new Date(),
): number {
  const targetDay = localDayKey(day);
  const answerIds = new Set<string>();
  const allSessions = currentSession ? [...sessions, currentSession] : sessions;
  allSessions.forEach((session) => {
    session.answers.forEach((answer) => {
      if (localDayKey(answer.answeredAt) === targetDay) answerIds.add(answer.questionId);
    });
  });
  return answerIds.size;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function createSession(entries: VocabularyEntry[], config: SessionConfiguration): LearningSession {
  const ordered = config.shuffleQuestions ? shuffle(entries) : entries;
  const selected = config.questionCount === 'all' ? ordered : ordered.slice(0, config.questionCount);
  const modes: Exclude<QuizMode, 'mixed'>[] = ['japanese-to-romaji', 'romaji-to-japanese', 'english-to-japanese'];
  const directions = selected.map((_, index) =>
    config.quizMode === 'mixed' ? modes[index % modes.length] : config.quizMode,
  );
  return {
    id: crypto.randomUUID(),
    configuration: config,
    vocabularyIds: selected.map((item) => item.id),
    directions,
    answers: [],
    currentQuestionIndex: 0,
    startedAt: new Date().toISOString(),
  };
}

export function buildChoices(current: VocabularyEntry, pool: VocabularyEntry[]): VocabularyEntry[] {
  const lessonChoices = pool.filter(
    (item) => item.id !== current.id && item.lessonId === current.lessonId && item.status === 'published',
  );
  return shuffle([current, ...shuffle(lessonChoices).slice(0, 3)]);
}
