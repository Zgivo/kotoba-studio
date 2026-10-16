import { ArrowRight, BarChart3, RotateCcw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SessionConfiguration } from '../../domain/types';
import { createSession, filterVocabulary } from '../../domain/learning';
import { useAppStore } from '../../store/app-store';
import { Badge, Button, EmptyState, PageHeader } from '../components/UI';
import { localizedWordMeaning, useI18n } from '../i18n';

export function Results() {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { currentSession, vocabulary, progress, setCurrentSession } = useAppStore();
  if (!currentSession?.completedAt)
    return (
      <div className="page">
        <EmptyState
          title={t('Результатов пока нет', 'No results yet', 'まだ結果がありません')}
          text={t(
            'Завершите тренировку, чтобы увидеть подробный разбор.',
            'Complete a practice session to see a detailed review.',
            '練習を完了すると詳しい結果が表示されます。',
          )}
          action={
            <Button onClick={() => navigate('/practice')}>
              {t('Начать тренировку', 'Start practice', '練習を始める')}
            </Button>
          }
        />
      </div>
    );
  const session = currentSession;
  const correct = session.answers.filter((item) => item.isCorrect).length;
  const wrong = session.answers.filter((item) => !item.isCorrect);
  const accuracy = session.answers.length ? Math.round((correct / session.answers.length) * 100) : 0;
  const seconds = Math.max(
    1,
    Math.round(
      (new Date(session.completedAt ?? session.startedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
    ),
  );
  let streak = 0;
  let best = 0;
  session.answers.forEach((item) => {
    streak = item.isCorrect ? streak + 1 : 0;
    best = Math.max(best, streak);
  });

  function repeatMistakes() {
    const ids = wrong.map((item) => item.vocabularyId);
    const entries = vocabulary.filter((item) => ids.includes(item.id));
    const config: SessionConfiguration = {
      ...session.configuration,
      questionCount: 'all',
      vocabularyFilter: 'all',
      shuffleQuestions: true,
    };
    setCurrentSession(createSession(entries, config));
    navigate('/quiz');
  }
  function repeatConfig() {
    const available = filterVocabulary(vocabulary, progress, session.configuration);
    setCurrentSession(createSession(available, session.configuration));
    navigate('/quiz');
  }

  return (
    <div className="page results-page">
      <PageHeader
        eyebrow={t('Сессия завершена', 'Session complete', 'セッション完了')}
        title={
          accuracy >= 80
            ? t('Отличная работа.', 'Excellent work.', 'よくできました。')
            : accuracy >= 50
              ? t('Хороший шаг вперёд.', 'A good step forward.', '着実な一歩です。')
              : t('Ошибки — часть пути.', 'Mistakes are part of learning.', '間違いも学びの一部です。')
        }
        text={t(
          'Каждый ответ уже учтён в вашей статистике и уровне освоения слов.',
          'Every answer is already reflected in your statistics and mastery level.',
          'すべての回答が統計と習得レベルに反映されています。',
        )}
      />
      <section className="result-hero">
        <div className="score-circle">
          <strong>{accuracy}%</strong>
          <span>{t('точность', 'accuracy', '正答率')}</span>
        </div>
        <div className="result-metrics">
          <div>
            <strong>{correct}</strong>
            <span>{t('верно', 'correct', '正解')}</span>
          </div>
          <div>
            <strong>{wrong.length}</strong>
            <span>{t('ошибки', 'mistakes', '間違い')}</span>
          </div>
          <div>
            <strong>{best}</strong>
            <span>{t('лучшая серия', 'best streak', '最高連続正解')}</span>
          </div>
          <div>
            <strong>
              {seconds < 60
                ? t(`${seconds} сек`, `${seconds} sec`, `${seconds}秒`)
                : t(
                    `${Math.round(seconds / 60)} мин`,
                    `${Math.round(seconds / 60)} min`,
                    `${Math.round(seconds / 60)}分`,
                  )}
            </strong>
            <span>{t('время', 'time', '時間')}</span>
          </div>
        </div>
      </section>
      {wrong.length ? (
        <section className="mistakes-section">
          <div className="section-title">
            <div>
              <span className="eyebrow">{t('На повторение', 'To review', '復習')}</span>
              <h2>
                {wrong.length}{' '}
                {language === 'ja'
                  ? '語'
                  : language === 'en'
                    ? wrong.length === 1
                      ? 'word'
                      : 'words'
                    : wrong.length === 1
                      ? 'слово'
                      : 'слова'}
              </h2>
            </div>
            <Button variant="secondary" onClick={repeatMistakes}>
              <RotateCcw size={16} /> {t('Повторить ошибки', 'Review mistakes', '間違いを復習')}
            </Button>
          </div>
          <div className="mistake-list">
            {wrong.map((answer) => {
              const word = vocabulary.find((item) => item.id === answer.vocabularyId);
              return (
                word && (
                  <article key={answer.questionId}>
                    <div>
                      <strong>{word.japanese}</strong>
                      <span>{word.romaji}</span>
                    </div>
                    <p>{localizedWordMeaning(word, language)}</p>
                    <Badge tone="red">
                      {t('Ваш ответ', 'Your answer', 'あなたの回答')}: {answer.submittedAnswer}
                    </Badge>
                  </article>
                )
              );
            })}
          </div>
        </section>
      ) : (
        <section className="perfect-card">
          <Sparkles />
          <div>
            <h2>{t('Без единой ошибки', 'No mistakes', '全問正解')}</h2>
            <p>
              {t(
                'Все ответы верны — кнопка повторения не нужна.',
                'Every answer was correct, so no review is needed.',
                'すべて正解です。復習は必要ありません。',
              )}
            </p>
          </div>
        </section>
      )}
      <div className="result-actions">
        <Button onClick={repeatConfig}>
          <RotateCcw size={16} /> {t('Повторить конфигурацию', 'Repeat setup', '同じ設定でもう一度')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/practice')}>
          {t('Новая сессия', 'New session', '新しいセッション')} <ArrowRight size={16} />
        </Button>
        <Button variant="ghost" onClick={() => navigate('/stats')}>
          <BarChart3 size={16} /> {t('Статистика', 'Statistics', '統計')}
        </Button>
      </div>
    </div>
  );
}
