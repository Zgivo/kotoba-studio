import { describe, expect, it } from 'vitest';
import type { VocabularyEntry } from '../domain/types';
import { localizedExampleMeaning, localizedWordMeaning, localizedWordMeaningLabel } from './i18n';

const word: VocabularyEntry = {
  id: 'word-1',
  lessonId: 'lesson-1',
  japanese: '先生',
  romaji: 'sensei',
  englishMeaning: 'teacher',
  russianMeaning: 'учитель',
  japaneseMeaning: '学校などで教える人',
  acceptedRomaji: [],
  scriptType: 'kanji',
  categoryIds: ['people'],
  exampleJapanese: '田中先生です。',
  exampleEnglish: 'This is Mr Tanaka, our teacher.',
  exampleRussian: 'Это наш учитель Танака.',
  exampleJapaneseMeaning: '田中さんは私たちの先生です。',
  status: 'published',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('localized vocabulary', () => {
  it.each([
    ['ru', 'учитель', 'Русский перевод', 'Это наш учитель Танака.'],
    ['en', 'teacher', 'English meaning', 'This is Mr Tanaka, our teacher.'],
    ['ja', '学校などで教える人', '日本語の意味', '田中さんは私たちの先生です。'],
  ] as const)('uses %s meanings throughout the interface', (language, meaning, label, example) => {
    expect(localizedWordMeaning(word, language)).toBe(meaning);
    expect(localizedWordMeaningLabel(language)).toBe(label);
    expect(localizedExampleMeaning(word, language)).toBe(example);
  });

  it('does not show an English example in Russian or Japanese when no localized example exists', () => {
    const onlyEnglish = { ...word, exampleRussian: undefined, exampleJapaneseMeaning: undefined };
    expect(localizedExampleMeaning(onlyEnglish, 'ru')).toBeUndefined();
    expect(localizedExampleMeaning(onlyEnglish, 'ja')).toBeUndefined();
  });
});
