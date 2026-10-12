import { describe, expect, it } from 'vitest';
import type { AppSnapshot } from '../domain/types';
import { initialSnapshot } from './seed';
import { migrateSnapshot } from './migrate';

describe('content migration', () => {
  it('adds lessons 5–10 without changing saved progress or settings', () => {
    const legacy = structuredClone(initialSnapshot) as AppSnapshot;
    legacy.contentVersion = 1;
    legacy.lessons = legacy.lessons.filter((lesson) => lesson.order <= 4);
    legacy.vocabulary = legacy.vocabulary.filter((entry) => Number(entry.lessonId.split('-')[1]) <= 4);
    legacy.categories = legacy.categories.filter(
      (category) => !['transport', 'communication', 'descriptions', 'positions'].includes(category.id),
    );
    legacy.settings.dailyGoal = 23;
    legacy.progress = [
      {
        vocabularyId: 'lesson-1-word-01',
        shownCount: 1,
        correctCount: 1,
        incorrectCount: 0,
        currentStreak: 1,
        bestStreak: 1,
        masteryLevel: 'learning',
        recentResults: [true],
      },
    ];

    const migrated = migrateSnapshot(legacy);

    expect(migrated.lessons).toHaveLength(25);
    expect(migrated.vocabulary).toHaveLength(413);
    expect(migrated.settings.dailyGoal).toBe(23);
    expect(migrated.progress).toEqual(legacy.progress);
    expect(migrated.contentVersion).toBe(4);
    expect(migrated.settings.interfaceLanguage).toBe('ru');
    expect(migrated.settings.interfaceTheme).toBe('light');
  });

  it('does not restore content deleted after the migration', () => {
    const current = structuredClone(initialSnapshot);
    current.lessons = current.lessons.filter((lesson) => lesson.id !== 'lesson-25');

    expect(migrateSnapshot(current)).toBe(current);
    expect(migrateSnapshot(current).lessons.some((lesson) => lesson.id === 'lesson-25')).toBe(false);
  });
});
