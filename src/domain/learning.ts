import type {
  LearningSession,
  MasteryLevel,
  QuizMode,
  SessionConfiguration,
  VocabularyEntry,
  VocabularyProgress,
} from './types';

export const masteryPolicy = {
  minimumAttempts: 3,
  familiarAccuracy: 0.7,
  masteredAccuracy: 0.86,
  masteredRecentCorrectAnswers: 4,
};

export function calculateMastery(progress: VocabularyProgress): MasteryLevel {
  if (progress.shownCount === 0) return 'new';
  const accuracy = progress.correctCount / progress.shownCount;
  if (
    progress.shownCount >= masteryPolicy.minimumAttempts + 2 &&
    accuracy >= masteryPolicy.masteredAccuracy &&
    progress.recentResults.slice(-4).every(Boolean)
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
    if (config.vocabularyFilter === 'new') return !current || current.masteryLevel === 'new';
    if (config.vocabularyFilter === 'learning') return current?.masteryLevel === 'learning';
    if (config.vocabularyFilter === 'mastered') return current?.masteryLevel === 'mastered';
    if (config.vocabularyFilter === 'mistakes')
      return current?.lastResult === 'incorrect' || Boolean(current?.incorrectCount);
    return true;
  });
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
  const close = pool.filter(
    (item) =>
      item.id !== current.id &&
      (item.lessonId === current.lessonId || item.categoryIds.some((id) => current.categoryIds.includes(id))),
  );
  const rest = pool.filter((item) => item.id !== current.id && !close.some((closeItem) => closeItem.id === item.id));
  return shuffle([current, ...shuffle([...close, ...rest]).slice(0, 3)]);
}
