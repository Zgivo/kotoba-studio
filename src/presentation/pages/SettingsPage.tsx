import { useRef, useState, type ChangeEvent } from 'react';
import { Download, FileJson, Moon, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import type { AppSnapshot, ExportEnvelope, InterfaceLanguage } from '../../domain/types';
import { importEnvelopeSchema } from '../../domain/validation';
import { useAppStore } from '../../store/app-store';
import { Button, Dialog, PageHeader } from '../components/UI';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

type ImportMode = 'replace' | 'merge' | 'new';

export function SettingsPage() {
  const store = useAppStore();
  const { language, setLanguage, t, dateLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<ExportEnvelope<AppSnapshot> | null>(null);
  const [error, setError] = useState('');
  function download(full: boolean) {
    const data: AppSnapshot = {
      contentVersion: store.contentVersion,
      lessons: store.lessons,
      vocabulary: store.vocabulary,
      categories: store.categories,
      progress: full ? store.progress : [],
      sessions: full ? store.sessions : [],
      currentSession: full ? store.currentSession : null,
      settings: store.settings,
      initialized: true,
    };
    const envelope: ExportEnvelope<AppSnapshot> = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      applicationVersion: '1.0.3',
      data,
    };
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kotoba-${full ? 'backup' : 'content'}-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    store.setNotice(
      full
        ? t('Полная резервная копия скачана.', 'Full backup downloaded.', '完全なバックアップをダウンロードしました。')
        : t('Учебный контент экспортирован.', 'Learning content exported.', '学習コンテンツを書き出しました。'),
    );
  }
  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const raw: unknown = JSON.parse(await file.text());
      const parsed = importEnvelopeSchema.safeParse(raw);
      if (!parsed.success) {
        setError(
          t(
            `Файл не прошёл проверку: ${parsed.error.issues[0]?.message ?? 'неизвестная ошибка'}`,
            `File validation failed: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
            `ファイルの検証に失敗しました: ${parsed.error.issues[0]?.message ?? '不明なエラー'}`,
          ),
        );
        return;
      }
      const data = parsed.data.data;
      setCandidate({
        schemaVersion: parsed.data.schemaVersion,
        exportedAt: parsed.data.exportedAt,
        applicationVersion: parsed.data.applicationVersion,
        data: {
          lessons: data.lessons,
          vocabulary: data.vocabulary,
          categories: data.categories,
          progress: data.progress ?? [],
          sessions: data.sessions ?? [],
          currentSession: data.currentSession ?? null,
          settings: data.settings
            ? {
                ...data.settings,
                interfaceLanguage: data.settings.interfaceLanguage ?? store.settings.interfaceLanguage,
                interfaceTheme: data.settings.interfaceTheme ?? store.settings.interfaceTheme,
              }
            : store.settings,
          initialized: true,
        },
      });
      setError('');
    } catch {
      setError(
        t(
          'Не удалось прочитать JSON. Проверьте, что файл не повреждён.',
          'Could not read the JSON file. Check that it is not damaged.',
          'JSONを読み込めませんでした。ファイルが破損していないか確認してください。',
        ),
      );
    }
  }
  function applyImport(mode: ImportMode) {
    if (!candidate) return;
    const incoming = candidate.data;
    if (mode === 'replace') store.replaceSnapshot(incoming);
    else {
      const lessonIds = new Set(store.lessons.map((item) => item.id));
      const vocabularyIds = new Set(store.vocabulary.map((item) => item.id));
      store.replaceSnapshot({
        ...incoming,
        lessons:
          mode === 'new'
            ? [...store.lessons, ...incoming.lessons.filter((item) => !lessonIds.has(item.id))]
            : mergeById(store.lessons, incoming.lessons),
        vocabulary:
          mode === 'new'
            ? [...store.vocabulary, ...incoming.vocabulary.filter((item) => !vocabularyIds.has(item.id))]
            : mergeById(store.vocabulary, incoming.vocabulary),
        categories: mergeById(store.categories, incoming.categories),
        progress: mode === 'new' ? store.progress : mergeById(store.progress, incoming.progress),
        sessions:
          mode === 'new'
            ? store.sessions
            : [
                ...incoming.sessions,
                ...store.sessions.filter((item) => !incoming.sessions.some((next) => next.id === item.id)),
              ],
        currentSession: store.currentSession,
        settings: store.settings,
        initialized: true,
      });
    }
    setCandidate(null);
    store.setNotice(
      t(
        'Импорт завершён. Локальная копия обновлена.',
        'Import complete. The local copy was updated.',
        'インポートが完了し、ローカルデータを更新しました。',
      ),
    );
  }
  async function reset() {
    if (
      window.confirm(
        t(
          'Сбросить контент, статистику и настройки? Будут восстановлены исходные 25 уроков.',
          'Reset content, statistics and settings? The original 25 lessons will be restored.',
          'コンテンツ・統計・設定をリセットしますか？初期の25課に戻ります。',
        ),
      )
    )
      await store.resetAll();
  }
  return (
    <div className="page">
      <PageHeader
        eyebrow={t('Данные и приложение', 'Data and application', 'データとアプリ')}
        title={t('Настройки', 'Settings', '設定')}
        text={t(
          'Управляйте целью, озвучиванием и резервными копиями. Все изменения хранятся только в этом браузере.',
          'Manage goals, audio and backups. All changes are stored only in this browser.',
          '目標・音声・バックアップを管理します。変更はこのブラウザ内にのみ保存されます。',
        )}
      />
      <div className="settings-grid">
        <section className="settings-card">
          <span className="settings-icon">日</span>
          <div>
            <span className="eyebrow">{t('Обучение', 'Learning', '学習')}</span>
            <h2>{t('Ежедневная цель', 'Daily goal', '1日の目標')}</h2>
            <p>
              {t(
                'Сколько ответов считать небольшой завершённой практикой.',
                'How many answers count as a completed short practice.',
                '短い練習の完了とみなす回答数です。',
              )}
            </p>
            <div className="segmented">
              {[5, 10, 20].map((goal) => (
                <button
                  key={goal}
                  className={store.settings.dailyGoal === goal ? 'active' : ''}
                  onClick={() => store.updateSettings({ dailyGoal: goal })}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="settings-card">
          <span className="settings-icon">音</span>
          <div>
            <span className="eyebrow">{t('Поведение', 'Behaviour', '動作')}</span>
            <h2>{t('Интерфейс', 'Interface', 'インターフェース')}</h2>
            <div
              className="segmented language-settings"
              aria-label={t('Язык интерфейса', 'Interface language', '表示言語')}
            >
              {(['ru', 'en', 'ja'] as InterfaceLanguage[]).map((code) => (
                <button key={code} className={language === code ? 'active' : ''} onClick={() => setLanguage(code)}>
                  {code === 'ru' ? 'Русский' : code === 'en' ? 'English' : '日本語'}
                </button>
              ))}
            </div>
            <label className="toggle-row compact">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={(event) => setTheme(event.target.checked ? 'dark' : 'light')}
              />
              <span />
              <div>
                <strong>
                  <Moon size={15} /> {t('Тёмная тема', 'Dark theme', 'ダークテーマ')}
                </strong>
                <small>
                  {t(
                    'Снижает яркость интерфейса при слабом освещении.',
                    'Reduces interface brightness in low light.',
                    '暗い場所で画面の明るさを抑えます。',
                  )}
                </small>
              </div>
            </label>
            <label className="toggle-row compact">
              <input
                type="checkbox"
                checked={store.settings.soundEnabled}
                onChange={(e) => store.updateSettings({ soundEnabled: e.target.checked })}
              />
              <span />
              <div>
                <strong>{t('Японское произношение', 'Japanese pronunciation', '日本語の発音')}</strong>
                <small>
                  {t(
                    'Использует Web Speech API браузера.',
                    "Uses the browser's Web Speech API.",
                    'ブラウザのWeb Speech APIを使用します。',
                  )}
                </small>
              </div>
            </label>
            <label className="toggle-row compact">
              <input
                type="checkbox"
                checked={store.settings.reducedMotion}
                onChange={(e) => store.updateSettings({ reducedMotion: e.target.checked })}
              />
              <span />
              <div>
                <strong>{t('Уменьшить движение', 'Reduce motion', '動きを減らす')}</strong>
                <small>
                  {t(
                    'Отключает плавные переходы.',
                    'Disables smooth transitions.',
                    '滑らかなトランジションを無効にします。',
                  )}
                </small>
              </div>
            </label>
          </div>
        </section>
        <section className="settings-card settings-card--wide">
          <ShieldCheck className="large-icon" />
          <div>
            <span className="eyebrow">{t('Резервное копирование', 'Backup', 'バックアップ')}</span>
            <h2>{t('Ваши данные принадлежат вам', 'Your data belongs to you', 'データはあなたのものです')}</h2>
            <p>
              {t(
                'Полная копия включает уроки, словарь, настройки, статистику и историю. Экспорт контента — только учебные материалы.',
                'A full backup includes lessons, vocabulary, settings, statistics and history. Content export includes learning material only.',
                '完全なバックアップにはレッスン・辞書・設定・統計・履歴が含まれます。コンテンツの書き出しは学習教材のみです。',
              )}
            </p>
            <div className="button-row">
              <Button onClick={() => download(true)}>
                <Download size={16} /> {t('Полная копия', 'Full backup', '完全なバックアップ')}
              </Button>
              <Button variant="secondary" onClick={() => download(false)}>
                <FileJson size={16} /> {t('Только контент', 'Content only', 'コンテンツのみ')}
              </Button>
              <input ref={fileRef} type="file" accept="application/json" hidden onChange={selectFile} />
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> {t('Импорт JSON', 'Import JSON', 'JSONをインポート')}
              </Button>
            </div>
            {error && <p className="inline-error">{error}</p>}
          </div>
        </section>
        <section className="danger-zone">
          <div>
            <span className="eyebrow">{t('Опасная зона', 'Danger zone', '注意')}</span>
            <h2>{t('Сбросить локальные данные', 'Reset local data', 'ローカルデータをリセット')}</h2>
            <p>
              {t(
                'Приложение вернётся к исходным 25 урокам. Перед сбросом лучше скачать полную копию.',
                'The application will return to the original 25 lessons. Download a full backup first.',
                '初期の25課に戻ります。先に完全なバックアップをダウンロードしてください。',
              )}
            </p>
          </div>
          <Button variant="danger" onClick={reset}>
            <RotateCcw size={16} /> {t('Сбросить всё', 'Reset everything', 'すべてリセット')}
          </Button>
        </section>
      </div>
      {candidate && (
        <Dialog title={t('Проверка импорта', 'Import review', 'インポートの確認')} onClose={() => setCandidate(null)}>
          <div className="import-dialog">
            <p>
              {t('Файл корректен. Экспортирован', 'The file is valid. Exported', 'ファイルは有効です。書き出し日時:')}{' '}
              {new Date(candidate.exportedAt).toLocaleString(dateLocale)}.
            </p>
            <div className="import-preview">
              <div>
                <strong>{candidate.data.lessons.length}</strong>
                <span>{t('уроков', 'lessons', 'レッスン')}</span>
              </div>
              <div>
                <strong>{candidate.data.vocabulary.length}</strong>
                <span>{t('слов', 'words', '語')}</span>
              </div>
              <div>
                <strong>{candidate.data.sessions.length}</strong>
                <span>{t('сессий', 'sessions', 'セッション')}</span>
              </div>
            </div>
            <h3>
              {t('Как объединить данные?', 'How should the data be combined?', 'データをどのように統合しますか？')}
            </h3>
            <button className="strategy" onClick={() => applyImport('merge')}>
              <strong>{t('Объединить', 'Merge', '統合')}</strong>
              <span>
                {t(
                  'Записи из файла обновят совпадающие ID.',
                  'File records update matching IDs.',
                  '同じIDのデータを更新します。',
                )}
              </span>
            </button>
            <button className="strategy" onClick={() => applyImport('new')}>
              <strong>{t('Только новые', 'New only', '新規のみ')}</strong>
              <span>
                {t('Совпадающие ID будут пропущены.', 'Matching IDs are skipped.', '同じIDはスキップします。')}
              </span>
            </button>
            <button className="strategy danger" onClick={() => applyImport('replace')}>
              <strong>{t('Полностью заменить', 'Replace everything', 'すべて置き換える')}</strong>
              <span>
                {t(
                  'Текущие данные будут заменены содержимым файла.',
                  'Current data will be replaced by the file contents.',
                  '現在のデータをファイルの内容で置き換えます。',
                )}
              </span>
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function mergeById<T extends { id?: string; vocabularyId?: string }>(current: T[], incoming: T[]): T[] {
  const key = (item: T) => item.id ?? item.vocabularyId ?? '';
  const map = new Map(current.map((item) => [key(item), item]));
  incoming.forEach((item) => map.set(key(item), item));
  return [...map.values()];
}
