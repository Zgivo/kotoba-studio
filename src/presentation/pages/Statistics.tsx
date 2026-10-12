import { AlertTriangle, BarChart3, CalendarDays, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/app-store';
import { EmptyState, PageHeader, ProgressBar, StatCard } from '../components/UI';
import { localizedLessonTitle, useI18n } from '../i18n';

export function Statistics() {
  const { lessons, vocabulary, progress, sessions } = useAppStore();
  const { language, t, dateLocale } = useI18n();
  const published = vocabulary.filter((item) => item.status === 'published');
  const totalShown = progress.reduce((sum, item) => sum + item.shownCount, 0);
  const totalCorrect = progress.reduce((sum, item) => sum + item.correctCount, 0);
  const accuracy = totalShown ? Math.round((totalCorrect / totalShown) * 100) : 0;
  const counts = {
    new: published.filter(
      (word) =>
        !progress.find((item) => item.vocabularyId === word.id) ||
        progress.find((item) => item.vocabularyId === word.id)?.masteryLevel === 'new',
    ).length,
    learning: progress.filter((item) => item.masteryLevel === 'learning').length,
    familiar: progress.filter((item) => item.masteryLevel === 'familiar').length,
    mastered: progress.filter((item) => item.masteryLevel === 'mastered').length,
  };
  const difficult = [...progress]
    .sort((a, b) => b.incorrectCount - a.incorrectCount)
    .filter((item) => item.incorrectCount > 0)
    .slice(0, 6);

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('Ваш прогресс', 'Your progress', '学習の進捗')}
        title={t('Статистика обучения', 'Learning statistics', '学習統計')}
        text={t(
          'Только реальные результаты — без искусственно заполненных графиков.',
          'Only real results, with no artificially filled charts.',
          '実際の学習結果だけを表示します。',
        )}
      />
      <div className="stats-grid stats-grid--wide">
        <StatCard
          value={published.length}
          label={t('Всего слов', 'Total words', '単語総数')}
          detail={t(`${counts.new} ещё не встречались`, `${counts.new} not seen yet`, `未出題 ${counts.new}語`)}
        />
        <StatCard
          value={counts.learning + counts.familiar}
          label={t('В процессе', 'In progress', '学習中')}
          detail={t(
            `${counts.familiar} уже знакомы`,
            `${counts.familiar} already familiar`,
            `確認済み ${counts.familiar}語`,
          )}
        />
        <StatCard
          value={counts.mastered}
          label={t('Освоено', 'Mastered', '習得済み')}
          detail={t('устойчивый результат', 'stable performance', '安定した成績')}
          accent
        />
        <StatCard
          value={`${accuracy}%`}
          label={t('Точность', 'Accuracy', '正答率')}
          detail={t(`${totalShown} ответов`, `${totalShown} answers`, `${totalShown}問`)}
        />
      </div>
      {!sessions.length ? (
        <EmptyState
          title={t(
            'Статистика появится после тренировки',
            'Statistics appear after practice',
            '練習後に統計が表示されます',
          )}
          text={t(
            'Выберите урок, ответьте хотя бы на один вопрос — и мы покажем точность, сложные слова и прогресс по урокам.',
            'Choose a lesson and answer at least one question to see accuracy, difficult words and lesson progress.',
            'レッスンを選び、1問以上回答すると、正答率・苦手な単語・レッスン別進捗が表示されます。',
          )}
        />
      ) : (
        <div className="stats-layout">
          <section className="chart-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">{t('Уроки', 'Lessons', 'レッスン')}</span>
                <h2>{t('Прогресс по материалам', 'Progress by lesson', '教材別の進捗')}</h2>
              </div>
              <BarChart3 />
            </div>
            <div className="lesson-progress-list">
              {lessons.map((lesson) => {
                const words = published.filter((item) => item.lessonId === lesson.id);
                const known = words.filter((item) =>
                  ['familiar', 'mastered'].includes(
                    progress.find((p) => p.vocabularyId === item.id)?.masteryLevel ?? '',
                  ),
                ).length;
                return (
                  <ProgressBar
                    key={lesson.id}
                    value={words.length ? (known / words.length) * 100 : 0}
                    label={localizedLessonTitle(lesson, language)}
                  />
                );
              })}
            </div>
          </section>
          <section className="chart-card">
            <div className="section-title">
              <div>
                <span className="eyebrow">{t('Требует внимания', 'Needs attention', '要復習')}</span>
                <h2>{t('Сложные слова', 'Difficult words', '苦手な単語')}</h2>
              </div>
              <AlertTriangle />
            </div>
            {difficult.length ? (
              <div className="difficult-list">
                {difficult.map((item, index) => {
                  const word = vocabulary.find((entry) => entry.id === item.vocabularyId);
                  return (
                    word && (
                      <article key={item.vocabularyId}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{word.japanese}</strong>
                        <p>
                          {word.romaji}
                          <small>{word.englishMeaning}</small>
                        </p>
                        <b>
                          {t(
                            `${item.incorrectCount} ошибок`,
                            `${item.incorrectCount} mistakes`,
                            `${item.incorrectCount}回不正解`,
                          )}
                        </b>
                      </article>
                    )
                  );
                })}
              </div>
            ) : (
              <p className="muted">{t('Ошибок пока нет.', 'No mistakes yet.', 'まだ間違いはありません。')}</p>
            )}
          </section>
          <section className="chart-card activity-history">
            <div className="section-title">
              <div>
                <span className="eyebrow">{t('История', 'History', '履歴')}</span>
                <h2>{t('Последние сессии', 'Recent sessions', '最近のセッション')}</h2>
              </div>
              <CalendarDays />
            </div>
            {sessions.slice(0, 7).map((session) => {
              const score = session.answers.length
                ? Math.round((session.answers.filter((item) => item.isCorrect).length / session.answers.length) * 100)
                : 0;
              return (
                <article key={session.id}>
                  <div>
                    <strong>
                      {new Date(session.startedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })}
                    </strong>
                    <small>
                      {t(
                        `${session.answers.length} вопросов`,
                        `${session.answers.length} questions`,
                        `${session.answers.length}問`,
                      )}
                    </small>
                  </div>
                  <span>{score}%</span>
                </article>
              );
            })}
          </section>
          <section className="chart-card mastery-card">
            <Trophy />
            <div>
              <span className="eyebrow">{t('Уровни освоения', 'Mastery levels', '習得レベル')}</span>
              <h2>
                {t(
                  `${counts.mastered} слов закреплено`,
                  `${counts.mastered} words mastered`,
                  `${counts.mastered}語を習得`,
                )}
              </h2>
              <p>
                {t(
                  'Слово становится освоенным после серии стабильных правильных ответов, а не одной удачной попытки.',
                  'A word becomes mastered after a stable series of correct answers, not a single lucky attempt.',
                  '1回の正解ではなく、安定して正解を重ねると習得済みになります。',
                )}
              </p>
            </div>
            <div className="mastery-legend">
              <span>
                <i className="new" /> {t('Новые', 'New', '新規')} — {counts.new}
              </span>
              <span>
                <i className="learning" /> {t('Изучаемые', 'Learning', '学習中')} — {counts.learning}
              </span>
              <span>
                <i className="familiar" /> {t('Знакомые', 'Familiar', '確認済み')} — {counts.familiar}
              </span>
              <span>
                <i className="mastered" /> {t('Освоенные', 'Mastered', '習得済み')} — {counts.mastered}
              </span>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
