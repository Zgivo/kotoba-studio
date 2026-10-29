import { useEffect } from 'react';
import type { InterfaceLanguage, Lesson, VocabularyCategory, VocabularyEntry } from '../domain/types';
import { useAppStore } from '../store/app-store';

export function tr(language: InterfaceLanguage, ru: string, en: string, ja: string): string {
  return language === 'ru' ? ru : language === 'en' ? en : ja;
}

export function normalizeInterfaceLanguage(language: InterfaceLanguage): Exclude<InterfaceLanguage, 'ja'> {
  return language === 'ja' ? 'en' : language;
}

export function useI18n() {
  const storedLanguage = useAppStore((state) => state.settings.interfaceLanguage ?? 'ru');
  const language = normalizeInterfaceLanguage(storedLanguage);
  const updateSettings = useAppStore((state) => state.updateSettings);

  useEffect(() => {
    document.documentElement.lang = language;
    if (storedLanguage !== language) updateSettings({ interfaceLanguage: language });
  }, [language, storedLanguage, updateSettings]);

  return {
    language,
    setLanguage: (next: InterfaceLanguage) => updateSettings({ interfaceLanguage: next }),
    t: (ru: string, en: string, ja: string) => tr(language, ru, en, ja),
    dateLocale: language === 'ru' ? 'ru-RU' : 'en-US',
  };
}

const lessonNames: Record<number, [string, string, string]> = {
  1: ['Люди и страны', 'People and countries', '人と国'],
  2: ['Вещи вокруг нас', 'Things around us', '身の回りの物'],
  3: ['Места и помещения', 'Places and rooms', '場所と施設'],
  4: ['Распорядок дня', 'Daily routine', '一日の生活'],
  5: ['Дорога и транспорт', 'Travel and transport', '移動と交通'],
  6: ['Действия и досуг', 'Actions and leisure', '行動と余暇'],
  7: ['Общение и обмен', 'Communication and exchange', '交流とやり取り'],
  8: ['Свойства и описания', 'Qualities and descriptions', '性質と描写'],
  9: ['Интересы и умения', 'Interests and skills', '興味と能力'],
  10: ['Где находится', 'Where things are', '場所と位置'],
  11: ['Люди, время и работа', 'People, time and work', '人・時間・仕事'],
  12: ['Сравнения и ощущения', 'Comparisons and sensations', '比較と感覚'],
  13: ['Досуг и самочувствие', 'Leisure and well-being', '余暇と体調'],
  14: ['Действия вокруг нас', 'Everyday actions', '身近な動作'],
  15: ['Жизнь и работа', 'Life and work', '生活と仕事'],
  16: ['Поездки и планы', 'Travel and plans', '移動と予定'],
  17: ['Память, обязанности и здоровье', 'Memory, duties and health', '記憶・用事・健康'],
  18: ['Умения и хобби', 'Skills and hobbies', '能力と趣味'],
  19: ['Быт и изменения', 'Home life and change', '暮らしと変化'],
  20: ['Необходимость и ремонт', 'Needs and repairs', '必要と修理'],
  21: ['Мнения и решения', 'Opinions and decisions', '意見と判断'],
  22: ['Одежда', 'Clothing', '服装'],
  23: ['Дорога, связь и переезд', 'Directions, contact and moving', '道案内・連絡・引っ越し'],
  24: ['Помощь и знакомство', 'Help and introductions', '手助けと紹介'],
  25: ['Планы и усилия', 'Plans and effort', '計画と努力'],
};

const lessonDescriptions: Record<number, [string, string, string]> = {
  1: ['Профессии, учеба, страны и знакомство', 'Jobs, study, countries and introductions', '職業・勉強・国・自己紹介'],
  2: [
    'Учебные принадлежности, техника и личные вещи',
    'Study supplies, devices and personal items',
    '学用品・機器・持ち物',
  ],
  3: [
    'Школа, офис, магазин и ориентирование в здании',
    'School, office, shops and finding your way indoors',
    '学校・会社・店・建物の案内',
  ],
  4: ['Действия, время, учеба и отдых', 'Actions, time, study and rest', '動作・時間・勉強・休み'],
  5: ['Направления, транспорт и поездки', 'Directions, transport and trips', '方向・交通・旅行'],
  6: [
    'Еда, покупки, встречи и повседневные действия',
    'Food, shopping, meetings and daily actions',
    '食事・買い物・待ち合わせ・日常動作',
  ],
  7: [
    'Передача вещей, обучение и рабочие документы',
    'Giving, learning and work documents',
    '物のやり取り・学習・仕事の書類',
  ],
  8: [
    'Люди, места, качества, цвета и оценки',
    'People, places, qualities, colours and opinions',
    '人・場所・性質・色・評価',
  ],
  9: [
    'Предпочтения, способности, планы и животные',
    'Preferences, abilities, plans and animals',
    '好み・能力・予定・動物',
  ],
  10: ['Наличие, положение и расположение предметов', 'Existence, position and location', '存在・位置・物の場所'],
  11: ['Люди, пребывание, затраты времени и работа', 'People, staying, time and work', '人・滞在・時間・仕事'],
  12: [
    'Расстояние, скорость, количество, погода и вкус',
    'Distance, speed, quantity, weather and taste',
    '距離・速さ・量・気候・味',
  ],
  13: ['Свободное время, желания и состояние тела', 'Free time, wishes and physical condition', '余暇・希望・体の状態'],
  14: ['Бытовые действия, просьбы и перемещение', 'Household actions, requests and movement', '日常動作・依頼・移動'],
  15: [
    'Жильё, работа, исследования и воспоминания',
    'Living, work, research and memories',
    '住まい・仕事・研究・思い出',
  ],
  16: [
    'Транспорт, банковские действия, планы и описание',
    'Transport, banking, plans and descriptions',
    '交通・銀行・予定・描写',
  ],
  17: ['Память, обязанности, безопасность и здоровье', 'Memory, duties, safety and health', '記憶・用事・安全・健康'],
  18: [
    'Возможности, музыка, коллекции и бронирование',
    'Abilities, music, collections and booking',
    '能力・音楽・収集・予約',
  ],
  19: ['Домашние дела, изменения и самочувствие', 'Housework, change and well-being', '家事・変化・体調'],
  20: ['Необходимые вещи, поиск информации и ремонт', 'Requirements, research and repairs', '必要・調査・修理'],
  21: [
    'Мысли, результаты, решения и полезность',
    'Thoughts, results, decisions and usefulness',
    '考え・結果・判断・役立つこと',
  ],
  22: ['Одежда, аксессуары и способы их носить', 'Clothes, accessories and how to wear them', '服・小物・着用表現'],
  23: [
    'Указания пути, связь, учёба и переезд',
    'Directions, contact, school and moving home',
    '道案内・連絡・進学・引っ越し',
  ],
  24: [
    'Помощь людям, объяснения и знакомство',
    'Helping people, explanations and introductions',
    '人の手助け・説明・紹介',
  ],
  25: [
    'Размышления, прибытие, достаточность и старание',
    'Thinking, arrival, sufficiency and effort',
    '考える・到着・十分・努力',
  ],
};

function lessonNumber(lesson: Lesson): number | undefined {
  const match = lesson.id.match(/^lesson-(\d+)$/);
  return match ? Number(match[1]) : undefined;
}

export function localizedLessonTitle(lesson: Lesson, language: InterfaceLanguage, withNumber = true): string {
  const number = lessonNumber(lesson);
  const names = number ? lessonNames[number] : undefined;
  if (!names) return lesson.title;
  const name = tr(language, ...names);
  return withNumber
    ? tr(language, `Урок ${number} · ${name}`, `Lesson ${number} · ${name}`, `第${number}課 · ${name}`)
    : name;
}

export function localizedLessonDescription(lesson: Lesson, language: InterfaceLanguage): string {
  const number = lessonNumber(lesson);
  const descriptions = number ? lessonDescriptions[number] : undefined;
  return descriptions ? tr(language, ...descriptions) : (lesson.description ?? '');
}

const categoryNames: Record<string, [string, string, string]> = {
  people: ['Люди и профессии', 'People and jobs', '人と職業'],
  countries: ['Страны', 'Countries', '国'],
  study: ['Учёба', 'Study', '学習'],
  objects: ['Предметы', 'Objects', '物'],
  technology: ['Техника', 'Technology', 'テクノロジー'],
  places: ['Места', 'Places', '場所'],
  daily: ['Повседневная жизнь', 'Daily life', '日常生活'],
  actions: ['Действия', 'Actions', '動作'],
  transport: ['Транспорт и поездки', 'Transport and travel', '交通と旅行'],
  communication: ['Общение', 'Communication', 'コミュニケーション'],
  descriptions: ['Свойства и описания', 'Qualities and descriptions', '性質と描写'],
  positions: ['Положение и место', 'Position and location', '位置と場所'],
  health: ['Здоровье и состояние', 'Health and condition', '健康と体調'],
  clothing: ['Одежда', 'Clothing', '服装'],
};

export function localizedCategoryName(category: VocabularyCategory, language: InterfaceLanguage): string {
  const names = categoryNames[category.id];
  return names ? tr(language, ...names) : category.name;
}

export function localizedWordMeaning(word: VocabularyEntry, language: InterfaceLanguage): string {
  if (language === 'ru') return word.russianMeaning ?? word.englishMeaning;
  if (language === 'ja') return word.japaneseMeaning ?? word.japanese;
  return word.englishMeaning;
}

export function localizedWordMeaningLabel(language: InterfaceLanguage): string {
  return tr(language, 'Русский перевод', 'English meaning', '日本語の意味');
}

export function localizedExampleMeaning(word: VocabularyEntry, language: InterfaceLanguage): string | undefined {
  if (language === 'ru') return word.exampleRussian;
  if (language === 'ja') return word.exampleJapaneseMeaning;
  return word.exampleEnglish;
}
