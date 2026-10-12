import { describe, expect, it } from 'vitest';
import { seedLessons, seedVocabulary } from './seed';

describe('seed lessons', () => {
  it('contains all 25 source lessons and 413 words', () => {
    expect(seedLessons).toHaveLength(25);
    expect(seedVocabulary).toHaveLength(413);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-1')).toHaveLength(29);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-2')).toHaveLength(38);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-3')).toHaveLength(27);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-4')).toHaveLength(13);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-5')).toHaveLength(16);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-6')).toHaveLength(13);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-7')).toHaveLength(14);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-8')).toHaveLength(32);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-9')).toHaveLength(12);
    expect(seedVocabulary.filter((item) => item.lessonId === 'lesson-10')).toHaveLength(14);
    const expected = [4, 15, 16, 24, 9, 24, 24, 11, 12, 3, 14, 12, 19, 11, 7];
    expected.forEach((count, index) => {
      expect(seedVocabulary.filter((item) => item.lessonId === `lesson-${index + 11}`)).toHaveLength(count);
    });
  });

  it('keeps each entry complete and published', () => {
    expect(
      seedVocabulary.every(
        (item) => item.japanese && item.romaji && item.englishMeaning && item.status === 'published',
      ),
    ).toBe(true);
  });
});
