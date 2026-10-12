import { useMemo, useState } from 'react';
import { ArrowRight, Check, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { QuizMode, SessionConfiguration } from '../../domain/types';
import { createSession, filterVocabulary } from '../../domain/learning';
import { useAppStore } from '../../store/app-store';
import { Button, PageHeader, SelectField } from '../components/UI';
import { localizedLessonTitle, useI18n } from '../i18n';

export function Practice() {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { lessons, vocabulary, progress, setCurrentSession } = useAppStore();
  const [lessonIds, setLessonIds] = useState(lessons.filter((item) => item.isPublished).map((item) => item.id));
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [count, setCount] = useState<number | 'all'>(10);
  const [filter, setFilter] = useState<SessionConfiguration['vocabularyFilter']>('all');
  const [shuffle, setShuffle] = useState(true);
  const config = useMemo<SessionConfiguration>(
    () => ({
      lessonIds,
      categoryIds: [],
      quizMode: mode,
      questionCount: count,
      vocabularyFilter: filter,
      shuffleQuestions: shuffle,
    }),
    [lessonIds, mode, count, filter, shuffle],
  );
  const available = useMemo(() => filterVocabulary(vocabulary, progress, config), [vocabulary, progress, config]);
  const actual = count === 'all' ? available.length : Math.min(available.length, count);
  const modes: { value: QuizMode; title: string; text: string }[] = [
    {
      value: 'mixed',
      title: t('Смешанный', 'Mixed', 'ミックス'),
      text: t('Все направления по очереди', 'All directions in rotation', 'すべての出題方向'),
    },
    {
      value: 'japanese-to-romaji',
      title: '日本語 → Romaji',
      text: t('Введите чтение', 'Type the reading', '読み方を入力'),
    },
    {
      value: 'romaji-to-japanese',
      title: 'Romaji → 日本語',
      text: t('Выберите написание', 'Choose the writing', '表記を選ぶ'),
    },
    {
      value: 'english-to-japanese',
      title: 'English → 日本語',
      text: t('Выберите слово', 'Choose the word', '単語を選ぶ'),
    },
  ];

  function toggleLesson(id: string) {
    setLessonIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }
  function start() {
    if (!available.length) return;
    setCurrentSession(createSession(available, config));
    navigate('/quiz');
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('Настройка сессии', 'Session setup', 'セッション設定')}
        title={t('Что повторим сегодня?', 'What shall we review today?', '今日は何を復習しますか？')}
        text={t(
          'Выберите уроки, направление и объём. Черновики и архивные слова не попадут в тренировку.',
          'Choose lessons, direction and length. Draft and archived words are excluded.',
          'レッスン・出題方向・問題数を選んでください。下書きとアーカイブ済みの単語は除外されます。',
        )}
      />
      <div className="config-layout">
        <section className="config-main">
          <div className="config-section">
            <div className="step-label">
              <span>01</span>
              <div>
                <h2>{t('Материал', 'Material', '教材')}</h2>
                <p>
                  {t(
                    'Можно выбрать несколько уроков.',
                    'You can select multiple lessons.',
                    '複数のレッスンを選べます。',
                  )}
                </p>
              </div>
            </div>
            <div className="select-all-row">
              <button onClick={() => setLessonIds(lessons.filter((item) => item.isPublished).map((item) => item.id))}>
                {t('Выбрать все', 'Select all', 'すべて選択')}
              </button>
              <button onClick={() => setLessonIds([])}>{t('Снять выбор', 'Clear selection', '選択を解除')}</button>
            </div>
            <div className="check-grid">
              {lessons.map((lesson) => (
                <label className={`check-card ${lessonIds.includes(lesson.id) ? 'is-selected' : ''}`} key={lesson.id}>
                  <input
                    type="checkbox"
                    checked={lessonIds.includes(lesson.id)}
                    onChange={() => toggleLesson(lesson.id)}
                  />
                  <span className="check-box">{lessonIds.includes(lesson.id) && <Check size={15} />}</span>
                  <div>
                    <strong>{localizedLessonTitle(lesson, language)}</strong>
                    <small>
                      {vocabulary.filter((item) => item.lessonId === lesson.id && item.status === 'published').length}{' '}
                      {t('слов', 'words', '語')}
                    </small>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="config-section">
            <div className="step-label">
              <span>02</span>
              <div>
                <h2>{t('Режим', 'Mode', 'モード')}</h2>
                <p>
                  {t(
                    'После каждого ответа откроется английское значение.',
                    'The English meaning appears after every answer.',
                    '回答後に英語の意味が表示されます。',
                  )}
                </p>
              </div>
            </div>
            <div className="mode-grid">
              {modes.map((item) => (
                <button
                  key={item.value}
                  className={`mode-card ${mode === item.value ? 'is-selected' : ''}`}
                  onClick={() => setMode(item.value)}
                >
                  <span>{item.title}</span>
                  <small>{item.text}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="config-section">
            <div className="step-label">
              <span>03</span>
              <div>
                <h2>{t('Фокус', 'Focus', 'フォーカス')}</h2>
                <p>
                  {t('Настройте длину и приоритет.', 'Set the length and priority.', '問題数と優先度を設定します。')}
                </p>
              </div>
            </div>
            <div className="form-grid">
              <SelectField
                label={t('Количество', 'Question count', '問題数')}
                value={String(count)}
                onChange={(event) => setCount(event.target.value === 'all' ? 'all' : Number(event.target.value))}
              >
                <option value="10">{t('10 вопросов', '10 questions', '10問')}</option>
                <option value="20">{t('20 вопросов', '20 questions', '20問')}</option>
                <option value="all">{t('Все подходящие', 'All matching', '対象すべて')}</option>
              </SelectField>
              <SelectField
                label={t('Какие слова', 'Which words', '単語の種類')}
                value={filter}
                onChange={(event) => setFilter(event.target.value as SessionConfiguration['vocabularyFilter'])}
              >
                <option value="all">{t('Все слова', 'All words', 'すべての単語')}</option>
                <option value="new">{t('Только новые', 'New only', '新しい単語のみ')}</option>
                <option value="learning">{t('Изучаемые', 'Learning', '学習中')}</option>
                <option value="mastered">{t('Освоенные', 'Mastered', '習得済み')}</option>
                <option value="mistakes">{t('С ошибками', 'With mistakes', '間違えた単語')}</option>
              </SelectField>
            </div>
            <label className="toggle-row">
              <input type="checkbox" checked={shuffle} onChange={(event) => setShuffle(event.target.checked)} />
              <span />
              <Shuffle size={18} />
              <div>
                <strong>{t('Случайный порядок', 'Shuffle', 'ランダム順')}</strong>
                <small>
                  {t(
                    'Слова будут перемешаны перед началом.',
                    'Words are shuffled before the session.',
                    '開始前に単語をシャッフルします。',
                  )}
                </small>
              </div>
            </label>
          </div>
        </section>
        <aside className="session-summary">
          <span className="eyebrow">{t('Ваша сессия', 'Your session', '今回のセッション')}</span>
          <strong>{actual}</strong>
          <h3>{wordForm(actual, language)}</h3>
          <dl>
            <div>
              <dt>{t('Уроков', 'Lessons', 'レッスン')}</dt>
              <dd>{lessonIds.length}</dd>
            </div>
            <div>
              <dt>{t('Режим', 'Mode', 'モード')}</dt>
              <dd>{modes.find((item) => item.value === mode)?.title}</dd>
            </div>
            <div>
              <dt>{t('Доступно', 'Available', '利用可能')}</dt>
              <dd>{available.length}</dd>
            </div>
          </dl>
          {available.length ? (
            <Button onClick={start}>
              {t('Начать сессию', 'Start session', 'セッション開始')} <ArrowRight size={17} />
            </Button>
          ) : (
            <div className="summary-warning">
              {t(
                'По этим условиям слов нет. Выберите другие уроки или фильтр.',
                'No words match these settings. Choose other lessons or a different filter.',
                '条件に合う単語がありません。別のレッスンまたはフィルターを選んでください。',
              )}
            </div>
          )}
          <p>
            {t(
              'Сессия сохранится автоматически — можно вернуться после обновления страницы.',
              'The session is saved automatically, so you can return after refreshing.',
              'セッションは自動保存され、ページを再読み込みしても続けられます。',
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}

function wordForm(value: number, language: 'ru' | 'en' | 'ja') {
  if (language === 'en') return value === 1 ? 'word' : 'words';
  if (language === 'ja') return '語';
  const mod10 = value % 10;
  const mod100 = value % 100;
  return mod10 === 1 && mod100 !== 11
    ? 'слово'
    : mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)
      ? 'слова'
      : 'слов';
}
