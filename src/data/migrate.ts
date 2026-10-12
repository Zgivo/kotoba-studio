import type { AppSnapshot } from '../domain/types';
import { initialSnapshot } from './seed';

const CURRENT_CONTENT_VERSION = 4;
const LESSONS_V2 = new Set(['lesson-5', 'lesson-6', 'lesson-7', 'lesson-8', 'lesson-9', 'lesson-10']);
const CATEGORIES_V2 = new Set(['transport', 'communication', 'descriptions', 'positions']);
const LESSONS_V3 = new Set(Array.from({ length: 15 }, (_, index) => `lesson-${index + 11}`));
const CATEGORIES_V3 = new Set(['health', 'clothing']);

function appendMissing<T extends { id: string }>(saved: T[], additions: T[]): T[] {
  const savedIds = new Set(saved.map((item) => item.id));
  return [...saved, ...additions.filter((item) => !savedIds.has(item.id))];
}

function appendContent(saved: AppSnapshot, lessonIds: Set<string>, categoryIds: Set<string>): AppSnapshot {
  return {
    ...saved,
    lessons: appendMissing(
      saved.lessons,
      initialSnapshot.lessons.filter((lesson) => lessonIds.has(lesson.id)),
    ),
    vocabulary: appendMissing(
      saved.vocabulary,
      initialSnapshot.vocabulary.filter((entry) => lessonIds.has(entry.lessonId)),
    ),
    categories: appendMissing(
      saved.categories,
      initialSnapshot.categories.filter((category) => categoryIds.has(category.id)),
    ),
  };
}

export function migrateSnapshot(saved: AppSnapshot): AppSnapshot {
  const version = saved.contentVersion ?? 1;
  if (version >= CURRENT_CONTENT_VERSION) return saved;

  let next = saved;
  if (version < 2) next = appendContent(next, LESSONS_V2, CATEGORIES_V2);
  if (version < 3) next = appendContent(next, LESSONS_V3, CATEGORIES_V3);

  return {
    ...next,
    contentVersion: CURRENT_CONTENT_VERSION,
    settings: {
      ...next.settings,
      interfaceLanguage: next.settings.interfaceLanguage ?? 'ru',
      interfaceTheme: next.settings.interfaceTheme ?? 'light',
    },
  };
}
