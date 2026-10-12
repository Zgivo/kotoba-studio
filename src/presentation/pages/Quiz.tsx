import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Volume2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildChoices } from '../../domain/learning';
import { validateRomaji } from '../../domain/romaji';
import type { SessionAnswer } from '../../domain/types';
import { speakJapanese } from '../../infrastructure/speech';
import { useAppStore } from '../../store/app-store';
import { Button, EmptyState } from '../components/UI';
import { localizedLessonTitle, useI18n } from '../i18n';

export function Quiz() {
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const { currentSession, vocabulary, lessons, recordAnswer, setCurrentSession, completeSession, settings, setNotice } =
    useAppStore();
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState('');
  const fieldRef = useRef<HTMLInputElement>(null);
  const current = currentSession
    ? vocabulary.find((item) => item.id === currentSession.vocabularyIds[currentSession.currentQuestionIndex])
    : undefined;
  const direction = currentSession?.directions[currentSession.currentQuestionIndex];
  const lesson = lessons.find((item) => item.id === current?.lessonId);
  const answered = currentSession?.answers.find(
    (item) => item.questionId === `${currentSession.id}-${currentSession.currentQuestionIndex}`,
  );
  const pool = useMemo(() => vocabulary.filter((item) => item.status === 'published'), [vocabulary]);
  const choices = useMemo(() => (current ? buildChoices(current, pool) : []), [current, pool]);
  const isText = direction === 'japanese-to-romaji';

  const submit = useCallback(() => {
    if (!currentSession || !current || !direction || answered) return;
    const submittedAnswer = isText ? input.trim() : selected;
    if (!submittedAnswer) return;
    const correct = isText
      ? validateRomaji(submittedAnswer, current.romaji, current.acceptedRomaji).isCorrect
      : submittedAnswer === current.id;
    const answer: SessionAnswer = {
      questionId: `${currentSession.id}-${currentSession.currentQuestionIndex}`,
      vocabularyId: current.id,
      direction,
      submittedAnswer,
      correctAnswer: isText ? current.romaji : current.japanese,
      isCorrect: correct,
      answeredAt: new Date().toISOString(),
    };
    recordAnswer(answer);
  }, [answered, current, currentSession, direction, input, isText, recordAnswer, selected]);

  const next = useCallback(() => {
    if (!currentSession || !answered) return;
    const last = currentSession.currentQuestionIndex >= currentSession.vocabularyIds.length - 1;
    setInput('');
    setSelected('');
    if (last) {
      completeSession();
      navigate('/results');
    } else setCurrentSession({ ...currentSession, currentQuestionIndex: currentSession.currentQuestionIndex + 1 });
  }, [answered, completeSession, currentSession, navigate, setCurrentSession]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' });
    setTimeout(() => fieldRef.current?.focus(), 50);
  }, [currentSession?.currentQuestionIndex, settings.reducedMotion]);
  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if (!currentSession || !current) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        if (answered) next();
        else submit();
      }
      if (!answered && direction !== 'japanese-to-romaji' && ['1', '2', '3', '4'].includes(event.key))
        setSelected(choices[Number(event.key) - 1]?.id ?? '');
    }
    window.addEventListener('keydown', keyboard);
    return () => window.removeEventListener('keydown', keyboard);
  }, [answered, choices, current, currentSession, direction, next, submit]);

  if (!currentSession || !current || !direction)
    return (
      <div className="page">
        <EmptyState
          title={t('Нет активной сессии', 'No active session', '進行中のセッションはありません')}
          text={t(
            'Настройте тренировку — она появится здесь.',
            'Set up a practice session and it will appear here.',
            '練習を設定すると、ここに表示されます。',
          )}
          action={
            <Button onClick={() => navigate('/practice')}>
              {t('Настроить сессию', 'Set up session', 'セッションを設定')}
            </Button>
          }
        />
      </div>
    );
  if (currentSession.completedAt) {
    navigate('/results');
    return null;
  }
  const activeWord = current;

  const question = isText
    ? current.japanese
    : direction === 'romaji-to-japanese'
      ? current.romaji
      : current.englishMeaning;
  const prompt = isText
    ? t('Введите ромадзи', 'Type the romaji', 'ローマ字を入力')
    : direction === 'romaji-to-japanese'
      ? t('Выберите японское написание', 'Choose the Japanese writing', '日本語の表記を選ぶ')
      : t('Как это будет по-японски?', 'How do you say this in Japanese?', '日本語では何と言いますか？');
  const progress =
    ((currentSession.currentQuestionIndex + (answered ? 1 : 0)) / currentSession.vocabularyIds.length) * 100;

  function finishEarly() {
    if (
      window.confirm(
        t(
          'Завершить сессию сейчас? Ответы останутся в статистике.',
          'End the session now? Your answers will remain in statistics.',
          'セッションを終了しますか？回答は統計に残ります。',
        ),
      )
    ) {
      completeSession();
      navigate('/results');
    }
  }
  function speak() {
    if (!settings.soundEnabled || !speakJapanese(activeWord.japanese))
      setNotice(
        t(
          'Озвучивание недоступно или отключено в настройках.',
          'Audio is unavailable or disabled in settings.',
          '音声が利用できないか、設定で無効になっています。',
        ),
      );
  }

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <button onClick={() => navigate('/practice')} className="back-link">
          <ArrowLeft size={18} /> {t('Настройка', 'Setup', '設定')}
        </button>
        <div className="quiz-progress">
          <div>
            <span>{lesson ? localizedLessonTitle(lesson, language) : ''}</span>
            <strong>
              {currentSession.currentQuestionIndex + 1} / {currentSession.vocabularyIds.length}
            </strong>
          </div>
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button className="finish-link" onClick={finishEarly}>
          {t('Завершить', 'Finish', '終了')}
        </button>
      </header>
      <main className="question-stage">
        <section className="question-card">
          <div className="question-label">
            <span>{prompt}</span>
            <small>{direction.replaceAll('-', ' → ')}</small>
          </div>
          <button
            className="question-word"
            onClick={speak}
            aria-label={t(`Озвучить ${current.japanese}`, `Play ${current.japanese}`, `${current.japanese}を再生`)}
          >
            <strong>{question}</strong>
            {isText && <Volume2 size={22} />}
          </button>
          {isText ? (
            <div className="answer-input-wrap">
              <input
                ref={fieldRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={Boolean(answered)}
                placeholder={t('Например: sensei', 'For example: sensei', '例: sensei')}
                aria-label={t('Ответ ромадзи', 'Romaji answer', 'ローマ字の回答')}
                autoComplete="off"
              />
              <small>{t('Enter — проверить ответ', 'Enter — check answer', 'Enter — 回答を確認')}</small>
            </div>
          ) : (
            <div className="answer-options">
              {choices.map((choice, index) => {
                const picked = selected === choice.id;
                const correct = choice.id === current.id;
                const state = answered
                  ? correct
                    ? 'is-correct'
                    : picked
                      ? 'is-wrong'
                      : ''
                  : picked
                    ? 'is-selected'
                    : '';
                return (
                  <button
                    key={choice.id}
                    className={state}
                    disabled={Boolean(answered)}
                    onClick={() => setSelected(choice.id)}
                  >
                    <span>{index + 1}</span>
                    <strong>{choice.japanese}</strong>
                    {answered && correct && <Check size={19} />}
                    {answered && picked && !correct && <X size={19} />}
                  </button>
                );
              })}
            </div>
          )}
          {!answered ? (
            <Button className="check-answer" onClick={submit} disabled={isText ? !input.trim() : !selected}>
              {t('Проверить ответ', 'Check answer', '回答を確認')}
            </Button>
          ) : (
            <Feedback
              answer={answered}
              current={current}
              onSpeak={speak}
              onNext={next}
              isLast={currentSession.currentQuestionIndex === currentSession.vocabularyIds.length - 1}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function Feedback({
  answer,
  current,
  onSpeak,
  onNext,
  isLast,
}: {
  answer: SessionAnswer;
  current: ReturnType<typeof useAppStore.getState>['vocabulary'][number];
  onSpeak: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className={`feedback ${answer.isCorrect ? 'feedback--correct' : 'feedback--wrong'}`} aria-live="assertive">
      <div className="feedback-icon">{answer.isCorrect ? <Check /> : <X />}</div>
      <div className="feedback-copy">
        <span>{answer.isCorrect ? t('Верно', 'Correct', '正解') : t('Неверно', 'Incorrect', '不正解')}</span>
        <div className="answer-reveal">
          <button onClick={onSpeak}>
            <strong>{current.japanese}</strong>
            <Volume2 size={17} />
          </button>
          <p>{current.romaji}</p>
          <h3>{current.englishMeaning}</h3>
          {current.exampleJapanese && (
            <blockquote>
              <span>{current.exampleJapanese}</span>
              <small>
                {current.exampleRomaji}
                <br />
                {current.exampleEnglish}
              </small>
            </blockquote>
          )}
        </div>
      </div>
      <Button onClick={onNext}>
        {isLast ? t('К результатам', 'View results', '結果を見る') : t('Дальше', 'Next', '次へ')}{' '}
        <ArrowRight size={17} />
      </Button>
    </div>
  );
}
