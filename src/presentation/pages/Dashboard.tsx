import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight, BookOpen, Flame, Play, Volume2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/app-store';
import { calculateMastery, countAnswersForLocalDay, createSession, filterVocabulary } from '../../domain/learning';
import type { SessionConfiguration } from '../../domain/types';
import { speakJapanese } from '../../infrastructure/speech';
import { Button, PageHeader, ProgressBar, StatCard } from '../components/UI';
import { localizedLessonDescription, localizedLessonTitle, useI18n } from '../i18n';

export function Dashboard() {
  const navigate = useNavigate();
  const { lessons, vocabulary, progress, sessions, currentSession, setCurrentSession, settings, setNotice } =
    useAppStore();
  const published = vocabulary.filter((item) => item.status === 'published');
  const progressById = new Map(progress.map((item) => [item.vocabularyId, item]));
  const mastered = published.filter((item) => {
    const wordProgress = progressById.get(item.id);
    return wordProgress ? calculateMastery(wordProgress) === 'mastered' : false;
  }).length;
  const totalAnswers = progress.reduce((sum, item) => sum + item.shownCount, 0);
  const totalCorrect = progress.reduce((sum, item) => sum + item.correctCount, 0);
  const todayAnswers = countAnswersForLocalDay(sessions, currentSession);
  const accuracy = totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : 0;
  const recent = sessions[0];
  const { language, t, dateLocale } = useI18n();

  function startQuick() {
    const config: SessionConfiguration = {
      lessonIds: lessons.filter((item) => item.isPublished).map((item) => item.id),
      categoryIds: [],
      quizMode: 'mixed',
      questionCount: 10,
      vocabularyFilter: 'all',
      shuffleQuestions: true,
    };
    const available = filterVocabulary(vocabulary, progress, config);
    setCurrentSession(createSession(available, config));
    navigate('/quiz');
  }

  return (
    <div className="page dashboard">
      <PageHeader
        eyebrow={t('今日の学習 · Сегодня', "今日の学習 · Today's study", '今日の学習')}
        title={t('Спокойный ритм. Ясный прогресс.', 'A calm rhythm. Clear progress.', '落ち着いたペース。確かな進歩。')}
        text={t(
          'Двадцать пять уроков уже готовы — начните короткую смешанную тренировку или выберите материал сами.',
          'Twenty-five lessons are ready. Start a short mixed practice or choose the material yourself.',
          '25課を用意しました。短いミックス練習を始めるか、教材を選んでください。',
        )}
        actions={
          <Button onClick={startQuick}>
            <Play size={17} fill="currentColor" /> {t('Начать 10 слов', 'Start 10 words', '10語で始める')}
          </Button>
        }
      />
      <section className="hero-grid">
        <article className="daily-card">
          <div>
            <span className="eyebrow">{t('Ежедневная практика', 'Daily practice', '毎日の練習')}</span>
            <h2>
              {t('Один небольшой шаг', 'One small step', '毎日、小さな一歩を')}
              <br />
              {t('каждый день.', 'every day.', '積み重ねよう。')}
            </h2>
            <p>
              {t('Сейчас в словаре', 'The dictionary now contains', '辞書には現在')} <strong>{published.length}</strong>{' '}
              {t(
                'слов. В каждой сессии вы связываете японское написание, ромадзи и русский перевод.',
                'words. Each session connects Japanese writing, romaji and English meaning.',
                '語あります。各セッションで日本語表記・ローマ字・日本語の意味を結び付けます。',
              )}
            </p>
          </div>
          <div
            className="daily-ring"
            style={{ '--value': `${Math.min(100, (todayAnswers / settings.dailyGoal) * 100)}%` } as CSSProperties}
          >
            <strong>{Math.min(todayAnswers, settings.dailyGoal)}</strong>
            <span>
              {t(`из ${settings.dailyGoal} сегодня`, `of ${settings.dailyGoal} today`, `本日${settings.dailyGoal}問中`)}
            </span>
          </div>
          <Button onClick={startQuick}>
            {t('Продолжить', 'Continue', '続ける')} <ArrowRight size={17} />
          </Button>
          <span className="hero-kanji" aria-hidden="true">
            続
          </span>
        </article>
        <div className="stats-grid">
          <StatCard
            value={mastered}
            label={t('Освоено', 'Mastered', '習得済み')}
            detail={t(`из ${published.length} слов`, `of ${published.length} words`, `${published.length}語中`)}
            accent
          />
          <StatCard
            value={`${accuracy}%`}
            label={t('Точность', 'Accuracy', '正答率')}
            detail={
              totalAnswers
                ? t(`${totalAnswers} ответов`, `${totalAnswers} answers`, `${totalAnswers}問`)
                : t('Первая сессия впереди', 'Your first session is ahead', '最初のセッションを始めましょう')
            }
          />
          <StatCard
            value={sessions.length}
            label={t('Сессий', 'Sessions', 'セッション')}
            detail={t('сохранено локально', 'saved locally', '端末に保存')}
          />
          <StatCard
            value={lessons.filter((item) => item.isPublished).length}
            label={t('Уроков', 'Lessons', 'レッスン')}
            detail={t('доступно сейчас', 'available now', '利用可能')}
          />
        </div>
      </section>

      <section className="section-block">
        <div className="section-title">
          <div>
            <span className="eyebrow">{t('Учебная библиотека', 'Learning library', '学習ライブラリ')}</span>
            <h2>{t('Ваши уроки', 'Your lessons', 'レッスン一覧')}</h2>
          </div>
          <Link to="/lessons">
            {t('Все уроки', 'All lessons', 'すべてのレッスン')} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="lesson-grid">
          {lessons
            .sort((a, b) => a.order - b.order)
            .map((lesson, index) => {
              const words = published.filter((item) => item.lessonId === lesson.id);
              const done = words.filter((word) => {
                const wordProgress = progressById.get(word.id);
                return wordProgress ? calculateMastery(wordProgress) === 'mastered' : false;
              }).length;
              const sample = words[(index * 3) % Math.max(words.length, 1)];
              return (
                <article
                  className="lesson-card"
                  key={lesson.id}
                  style={{ '--lesson-color': lesson.color } as CSSProperties}
                >
                  <div className="lesson-number">{String(lesson.order).padStart(2, '0')}</div>
                  <div className="lesson-card__body">
                    <BadgeMini>
                      {lesson.isPublished ? t('Опубликован', 'Published', '公開中') : t('Черновик', 'Draft', '下書き')}
                    </BadgeMini>
                    <h3>{localizedLessonTitle(lesson, language, false)}</h3>
                    <p>{localizedLessonDescription(lesson, language)}</p>
                    {sample && (
                      <button
                        className="word-sample"
                        onClick={() => {
                          if (!speakJapanese(sample.japanese))
                            setNotice(
                              t(
                                'Озвучивание недоступно в этом браузере.',
                                'Audio is unavailable in this browser.',
                                'このブラウザでは音声を利用できません。',
                              ),
                            );
                        }}
                      >
                        <span>{sample.japanese}</span>
                        <small>{sample.romaji}</small>
                        <Volume2 size={15} />
                      </button>
                    )}
                    <ProgressBar
                      value={words.length ? (done / words.length) * 100 : 0}
                      label={t(
                        `${done} из ${words.length}`,
                        `${done} of ${words.length}`,
                        `${words.length}語中${done}語`,
                      )}
                    />
                  </div>
                </article>
              );
            })}
        </div>
      </section>

      <section className="bottom-grid">
        <article className="activity-card">
          <div className="section-title">
            <div>
              <span className="eyebrow">{t('Последняя сессия', 'Latest session', '前回のセッション')}</span>
              <h2>
                {recent
                  ? new Date(recent.startedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long' })
                  : t('Пока тихо', 'Nothing yet', 'まだありません')}
              </h2>
            </div>
            <Flame />
          </div>
          {recent ? (
            <>
              <p>
                {t(
                  `${recent.answers.filter((item) => item.isCorrect).length} верных из ${recent.answers.length}`,
                  `${recent.answers.filter((item) => item.isCorrect).length} correct out of ${recent.answers.length}`,
                  `${recent.answers.length}問中${recent.answers.filter((item) => item.isCorrect).length}問正解`,
                )}
              </p>
              <ProgressBar
                value={
                  (recent.answers.filter((item) => item.isCorrect).length / Math.max(recent.answers.length, 1)) * 100
                }
                label={t('Результат', 'Result', '結果')}
              />
            </>
          ) : (
            <p>
              {t(
                'Завершите первую тренировку — здесь появится результат.',
                'Complete your first practice and the result will appear here.',
                '最初の練習を終えると、ここに結果が表示されます。',
              )}
            </p>
          )}
        </article>
        <article className="editor-promo">
          <BookOpen />
          <div>
            <span className="eyebrow">{t('Свой материал', 'Your material', '自分の教材')}</span>
            <h2>{t('Словарь растёт вместе с вами', 'Your dictionary grows with you', '辞書を自分らしく育てよう')}</h2>
            <p>
              {t(
                'Добавляйте слова, примеры и допустимые варианты ромадзи без изменения кода.',
                'Add words, examples and accepted romaji variants without changing code.',
                'コードを変更せずに単語・例文・ローマ字の別表記を追加できます。',
              )}
            </p>
            <Link to="/editor">
              {t('Открыть редактор', 'Open editor', '編集を開く')} <ArrowRight size={16} />
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function BadgeMini({ children }: { children: ReactNode }) {
  return <span className="mini-badge">{children}</span>;
}
