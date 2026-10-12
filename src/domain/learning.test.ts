import { describe, expect, it } from 'vitest';
import { calculateMastery, createSession, filterVocabulary, updateProgress } from './learning';
import { seedVocabulary } from '../data/seed';
import type { SessionConfiguration, VocabularyProgress } from './types';

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
    for (let i = 0; i < 5; i += 1) progress = updateProgress(progress, 'word', true);
    expect(progress?.bestStreak).toBe(5);
    expect(calculateMastery(progress!)).toBe('mastered');
    expect(updateProgress(progress, 'word', false).currentStreak).toBe(0);
  });
});
