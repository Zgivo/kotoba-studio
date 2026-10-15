import { describe, expect, it } from 'vitest';
import { calculateMastery, countAnswersForLocalDay, createSession, filterVocabulary, updateProgress } from './learning';
import { seedVocabulary } from '../data/seed';
import type { LearningSession, SessionConfiguration, VocabularyProgress } from './types';

const config: SessionConfiguration = {
  lessonIds: ['lesson-1'],
  categoryIds: [],
  quizMode: 'mixed',
  questionCount: 10,
  vocabularyFilter: 'all',
  shuffleQuestions: false,
};

describe('learning rules', () => {
  it('filters unpublished and non-selected lesson content', () => {
    const result = filterVocabulary(seedVocabulary, [], config);
    expect(result).toHaveLength(29);
    expect(result.every((item) => item.lessonId === 'lesson-1')).toBe(true);
  });

  it('balances a mixed session across all three directions', () => {
    const session = createSession(seedVocabulary.slice(0, 6), { ...config, questionCount: 6 });
    expect(new Set(session.directions)).toHaveLength(3);
    expect(session.directions).toEqual([
      'japanese-to-romaji',
      'romaji-to-japanese',
      'english-to-japanese',
      'japanese-to-romaji',
      'romaji-to-japanese',
      'english-to-japanese',
    ]);
  });

  it('updates streaks and mastery without UI dependencies', () => {
    let progress: VocabularyProgress | undefined;
    progress = updateProgress(progress, 'word', true);
    progress = updateProgress(progress, 'word', true);
    expect(calculateMastery(progress)).toBe('familiar');
    progress = updateProgress(progress, 'word', true);
    expect(progress.bestStreak).toBe(3);
    expect(calculateMastery(progress!)).toBe('mastered');
    expect(updateProgress(progress, 'word', false).currentStreak).toBe(0);
  });

  it('counts only unique answers from the current local day', () => {
    const session = createSession(seedVocabulary.slice(0, 2), { ...config, questionCount: 2 });
    const today = new Date(2026, 9, 15, 12);
    const yesterday = new Date(2026, 9, 14, 23, 59).toISOString();
    const todayAnswer = new Date(2026, 9, 15, 0, 1).toISOString();
    const completed: LearningSession = {
      ...session,
      completedAt: today.toISOString(),
      answers: [
        {
          questionId: `${session.id}-0`,
          vocabularyId: session.vocabularyIds[0],
          direction: session.directions[0],
          submittedAnswer: 'answer',
          correctAnswer: 'answer',
          isCorrect: true,
          answeredAt: yesterday,
        },
        {
          questionId: `${session.id}-1`,
          vocabularyId: session.vocabularyIds[1],
          direction: session.directions[1],
          submittedAnswer: 'answer',
          correctAnswer: 'answer',
          isCorrect: true,
          answeredAt: todayAnswer,
        },
      ],
    };

    expect(countAnswersForLocalDay([completed], completed, today)).toBe(1);
  });
});
