import { useMemo, useState, type FormEvent } from 'react';
import { Archive, CheckSquare2, Edit3, Plus, Search, Trash2, Upload, Volume2, X } from 'lucide-react';
import type { ContentStatus, JapaneseScriptType, VocabularyEntry } from '../../domain/types';
import { speakJapanese } from '../../infrastructure/speech';
import { useAppStore } from '../../store/app-store';
import { Badge, Button, Dialog, EmptyState, Field, PageHeader, SelectField } from '../components/UI';
import { localizedCategoryName, localizedLessonTitle, tr, useI18n } from '../i18n';

export function Editor() {
  const {
    vocabulary,
    lessons,
    categories,
    saveVocabulary,
    saveVocabularyMany,
    updateVocabularyStatus,
    deleteVocabulary,
    setNotice,
  } = useAppStore();
  const { language, t } = useI18n();
  const [query, setQuery] = useState('');
  const [lessonId, setLessonId] = useState('all');
  const [status, setStatus] = useState('all');
  const [script, setScript] = useState('all');
  const [editing, setEditing] = useState<VocabularyEntry | 'new' | null>(null);
  const [bulk, setBulk] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ContentStatus>('published');
  const filtered = useMemo(
    () =>
      vocabulary
        .filter((item) => {
          const needle = query.trim().toLowerCase();
          const matches =
            !needle ||
            [item.japanese, item.romaji, item.englishMeaning].some((value) => value.toLowerCase().includes(needle));
          return (
            matches &&
            (lessonId === 'all' || item.lessonId === lessonId) &&
            (status === 'all' || item.status === status) &&
            (script === 'all' || item.scriptType === script)
          );
        })
        .sort((a, b) => a.japanese.localeCompare(b.japanese, 'ja')),
    [vocabulary, query, lessonId, status, script],
  );
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selected.has(item.id));

  function toggleSelected(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }
  function toggleAllVisible() {
    const visibleIds = filtered.map((item) => item.id);
    if (allVisibleSelected) setSelectedIds((ids) => ids.filter((id) => !visibleIds.includes(id)));
    else setSelectedIds((ids) => [...new Set([...ids, ...visibleIds])]);
  }
  function applyBulkStatus() {
    if (!selectedIds.length) return;
    const count = selectedIds.length;
    updateVocabularyStatus(selectedIds, bulkStatus);
    setSelectedIds([]);
    setNotice(
      t(`Статус изменён для ${count} слов.`, `Status updated for ${count} words.`, `${count}語の状態を変更しました。`),
    );
  }
  function remove(item: VocabularyEntry) {
    if (
      window.confirm(
        t(
          `Удалить «${item.japanese}»? Это действие нельзя отменить.`,
          `Delete “${item.japanese}”? This cannot be undone.`,
          `「${item.japanese}」を削除しますか？この操作は取り消せません。`,
        ),
      )
    ) {
      deleteVocabulary(item.id);
      setSelectedIds((ids) => ids.filter((id) => id !== item.id));
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('Словарь', 'Vocabulary', '辞書')}
        title={t('Редактор материалов', 'Content editor', '教材編集')}
        text={t(
          `${vocabulary.length} слов · поиск по японскому, ромадзи и английскому значению`,
          `${vocabulary.length} words · search Japanese, romaji and English meaning`,
          `${vocabulary.length}語 · 日本語・ローマ字・英語の意味で検索`,
        )}
        actions={
          <>
            <Button variant="secondary" onClick={() => setBulk(true)}>
              <Upload size={16} /> {t('Массовое добавление', 'Bulk add', '一括追加')}
            </Button>
            <Button onClick={() => setEditing('new')}>
              <Plus size={16} /> {t('Добавить слово', 'Add word', '単語を追加')}
            </Button>
          </>
        }
      />
      <section className="filter-bar">
        <label className="search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Найти слово…', 'Find a word…', '単語を検索…')}
            aria-label={t('Поиск слов', 'Word search', '単語検索')}
          />
        </label>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          aria-label={t('Фильтр по уроку', 'Lesson filter', 'レッスンで絞り込む')}
        >
          <option value="all">{t('Все уроки', 'All lessons', 'すべてのレッスン')}</option>
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {localizedLessonTitle(lesson, language)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label={t('Фильтр по статусу', 'Status filter', '状態で絞り込む')}
        >
          <option value="all">{t('Все статусы', 'All statuses', 'すべての状態')}</option>
          <option value="published">{t('Опубликовано', 'Published', '公開')}</option>
          <option value="draft">{t('Черновики', 'Drafts', '下書き')}</option>
          <option value="archived">{t('Архив', 'Archived', 'アーカイブ')}</option>
        </select>
        <select
          value={script}
          onChange={(e) => setScript(e.target.value)}
          aria-label={t('Фильтр по письменности', 'Script filter', '文字種で絞り込む')}
        >
          <option value="all">{t('Все типы', 'All scripts', 'すべての文字種')}</option>
          <option value="kanji">{t('Кандзи', 'Kanji', '漢字')}</option>
          <option value="hiragana">{t('Хирагана', 'Hiragana', 'ひらがな')}</option>
          <option value="katakana">{t('Катакана', 'Katakana', 'カタカナ')}</option>
          <option value="mixed">{t('Смешанное', 'Mixed', '混在')}</option>
        </select>
        <span>{t(`${filtered.length} найдено`, `${filtered.length} found`, `${filtered.length}件`)}</span>
      </section>
      {selectedIds.length > 0 && (
        <section className="bulk-status-bar" aria-live="polite">
          <div>
            <CheckSquare2 size={18} />
            <strong>
              {t(`Выбрано: ${selectedIds.length}`, `${selectedIds.length} selected`, `${selectedIds.length}語を選択中`)}
            </strong>
          </div>
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value as ContentStatus)}
            aria-label={t('Новый статус выбранных слов', 'New status for selected words', '選択した単語の新しい状態')}
          >
            <option value="published">{t('Опубликовано', 'Published', '公開')}</option>
            <option value="draft">{t('Черновик', 'Draft', '下書き')}</option>
            <option value="archived">{t('Архив', 'Archived', 'アーカイブ')}</option>
          </select>
          <Button onClick={applyBulkStatus}>{t('Применить', 'Apply', '適用')}</Button>
          <button
            className="bulk-status-clear"
            onClick={() => setSelectedIds([])}
            aria-label={t('Снять выделение', 'Clear selection', '選択を解除')}
          >
            <X size={18} />
          </button>
        </section>
      )}
      {filtered.length ? (
        <>
          <div className="word-table">
            <div className="word-table__head">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                aria-label={t('Выбрать все найденные слова', 'Select all filtered words', '絞り込み結果をすべて選択')}
              />
              <span>{t('Слово', 'Word', '単語')}</span>
              <span>{t('Ромадзи', 'Romaji', 'ローマ字')}</span>
              <span>English meaning</span>
              <span>{t('Урок', 'Lesson', 'レッスン')}</span>
              <span>{t('Статус', 'Status', '状態')}</span>
              <span />
            </div>
            {filtered.map((item) => (
              <article key={item.id} className={selected.has(item.id) ? 'is-selected' : undefined}>
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelected(item.id)}
                  aria-label={t(`Выбрать ${item.japanese}`, `Select ${item.japanese}`, `${item.japanese}を選択`)}
                />
                <div className="word-primary">
                  <button
                    onClick={() => {
                      if (!speakJapanese(item.japanese))
                        setNotice(t('Озвучивание недоступно.', 'Audio is unavailable.', '音声を利用できません。'));
                    }}
                    aria-label={t(`Озвучить ${item.japanese}`, `Play ${item.japanese}`, `${item.japanese}を再生`)}
                  >
                    <Volume2 size={15} />
                  </button>
                  <strong>{item.japanese}</strong>
                  <small>{scriptLabel(item.scriptType, language)}</small>
                </div>
                <span>{item.romaji}</span>
                <span>{item.englishMeaning}</span>
                <span className="lesson-cell">
                  {(() => {
                    const lesson = lessons.find((lesson) => lesson.id === item.lessonId);
                    return lesson ? localizedLessonTitle(lesson, language, false) : '';
                  })()}
                </span>
                <span>
                  <Badge tone={item.status === 'published' ? 'green' : item.status === 'draft' ? 'gold' : 'neutral'}>
                    {statusLabel(item.status, language)}
                  </Badge>
                </span>
                <div className="row-actions">
                  <button onClick={() => setEditing(item)} title={t('Редактировать', 'Edit', '編集')}>
                    <Edit3 />
                  </button>
                  <button
                    onClick={() =>
                      saveVocabulary({
                        ...item,
                        status: item.status === 'archived' ? 'draft' : 'archived',
                        updatedAt: new Date().toISOString(),
                      })
                    }
                    title={t('В архив', 'Archive', 'アーカイブ')}
                  >
                    <Archive />
                  </button>
                  <button className="danger" onClick={() => remove(item)} title={t('Удалить', 'Delete', '削除')}>
                    <Trash2 />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="mobile-word-list">
            {filtered.map((item) => (
              <article key={item.id} className={selected.has(item.id) ? 'is-selected' : undefined}>
                <header>
                  <input
                    type="checkbox"
                    checked={selected.has(item.id)}
                    onChange={() => toggleSelected(item.id)}
                    aria-label={t(`Выбрать ${item.japanese}`, `Select ${item.japanese}`, `${item.japanese}を選択`)}
                  />
                  <div>
                    <strong>{item.japanese}</strong>
                    <span>{item.romaji}</span>
                  </div>
                  <Badge tone={item.status === 'published' ? 'green' : item.status === 'draft' ? 'gold' : 'neutral'}>
                    {statusLabel(item.status, language)}
                  </Badge>
                </header>
                <p>{item.englishMeaning}</p>
                <small>
                  {(() => {
                    const lesson = lessons.find((lesson) => lesson.id === item.lessonId);
                    return lesson ? localizedLessonTitle(lesson, language) : '';
                  })()}
                </small>
                <footer>
                  <button onClick={() => setEditing(item)}>
                    <Edit3 /> {t('Изменить', 'Edit', '編集')}
                  </button>
                  <button onClick={() => remove(item)}>
                    <Trash2 /> {t('Удалить', 'Delete', '削除')}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={t('Ничего не найдено', 'Nothing found', '見つかりませんでした')}
          text={t(
            'Измените фильтры или добавьте новую словарную запись.',
            'Change the filters or add a new vocabulary entry.',
            'フィルターを変更するか、新しい単語を追加してください。',
          )}
          action={<Button onClick={() => setEditing('new')}>{t('Добавить слово', 'Add word', '単語を追加')}</Button>}
        />
      )}
      {editing && (
        <WordDialog
          entry={editing === 'new' ? null : editing}
          lessons={lessons}
          categories={categories}
          allEntries={vocabulary}
          onClose={() => setEditing(null)}
          onSave={(entry) => {
            saveVocabulary(entry);
            setEditing(null);
            setNotice(
              entry.status === 'draft'
                ? t('Черновик сохранён.', 'Draft saved.', '下書きを保存しました。')
                : t('Слово сохранено.', 'Word saved.', '単語を保存しました。'),
            );
          }}
        />
      )}
      {bulk && (
        <BulkDialog
          lessons={lessons}
          existing={vocabulary}
          onClose={() => setBulk(false)}
          onSave={(entries) => {
            saveVocabularyMany(entries);
            setBulk(false);
            setNotice(
              t(
                `Добавлено слов: ${entries.length}.`,
                `${entries.length} words added.`,
                `${entries.length}語を追加しました。`,
              ),
            );
          }}
        />
      )}
    </div>
  );
}

function scriptLabel(value: JapaneseScriptType, language: 'ru' | 'en' | 'ja') {
  const labels = {
    kanji: ['кандзи', 'kanji', '漢字'],
    hiragana: ['хирагана', 'hiragana', 'ひらがな'],
    katakana: ['катакана', 'katakana', 'カタカナ'],
    mixed: ['смешанное', 'mixed', '混在'],
  } as const;
  const [ru, en, ja] = labels[value];
  return tr(language, ru, en, ja);
}
function statusLabel(value: ContentStatus, language: 'ru' | 'en' | 'ja') {
  const labels = {
    published: ['Опубликовано', 'Published', '公開'],
    draft: ['Черновик', 'Draft', '下書き'],
    archived: ['Архив', 'Archived', 'アーカイブ'],
  } as const;
  const [ru, en, ja] = labels[value];
  return tr(language, ru, en, ja);
}

function WordDialog({
  entry,
  lessons,
  categories,
  allEntries,
  onClose,
  onSave,
}: {
  entry: VocabularyEntry | null;
  lessons: ReturnType<typeof useAppStore.getState>['lessons'];
  categories: ReturnType<typeof useAppStore.getState>['categories'];
  allEntries: VocabularyEntry[];
  onClose: () => void;
  onSave: (entry: VocabularyEntry) => void;
}) {
  const { language, t } = useI18n();
  const [japanese, setJapanese] = useState(entry?.japanese ?? '');
  const [romaji, setRomaji] = useState(entry?.romaji ?? '');
  const [english, setEnglish] = useState(entry?.englishMeaning ?? '');
  const [lessonId, setLessonId] = useState(entry?.lessonId ?? lessons[0]?.id ?? '');
  const [script, setScript] = useState<JapaneseScriptType>(entry?.scriptType ?? 'mixed');
  const [status, setStatus] = useState<ContentStatus>(entry?.status ?? 'draft');
  const [accepted, setAccepted] = useState(entry?.acceptedRomaji.join(', ') ?? '');
  const [hint, setHint] = useState(entry?.hint ?? '');
  const [exampleJa, setExampleJa] = useState(entry?.exampleJapanese ?? '');
  const [exampleRo, setExampleRo] = useState(entry?.exampleRomaji ?? '');
  const [exampleEn, setExampleEn] = useState(entry?.exampleEnglish ?? '');
  const [categoryIds, setCategoryIds] = useState(entry?.categoryIds ?? []);
  const duplicate = allEntries.find(
    (item) => item.id !== entry?.id && item.japanese.trim() === japanese.trim() && item.lessonId === lessonId,
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!japanese.trim() || !romaji.trim() || !english.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: entry?.id ?? crypto.randomUUID(),
      lessonId,
      japanese: japanese.trim(),
      romaji: romaji.trim(),
      englishMeaning: english.trim(),
      acceptedRomaji: accepted
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      scriptType: script,
      categoryIds,
      hint: hint.trim() || undefined,
      exampleJapanese: exampleJa.trim() || undefined,
      exampleRomaji: exampleRo.trim() || undefined,
      exampleEnglish: exampleEn.trim() || undefined,
      status,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
    });
  }
  return (
    <Dialog
      title={entry ? t('Редактировать слово', 'Edit word', '単語を編集') : t('Новое слово', 'New word', '新しい単語')}
      onClose={onClose}
      wide
    >
      <form className="dialog-form" onSubmit={submit}>
        <div className="editor-form-grid">
          <div>
            <Field
              label={t('Японское написание *', 'Japanese writing *', '日本語表記 *')}
              value={japanese}
              onChange={(e) => setJapanese(e.target.value)}
              required
              autoFocus
            />
            {duplicate && (
              <p className="inline-warning">
                {t(
                  `В этом уроке уже есть «${duplicate.japanese}».`,
                  `“${duplicate.japanese}” is already in this lesson.`,
                  `このレッスンには「${duplicate.japanese}」が既にあります。`,
                )}
              </p>
            )}
            <Field
              label={t('Основная ромадзи *', 'Primary romaji *', '基本ローマ字 *')}
              value={romaji}
              onChange={(e) => setRomaji(e.target.value)}
              required
            />
            <Field label="English meaning *" value={english} onChange={(e) => setEnglish(e.target.value)} required />
            <SelectField
              label={t('Урок', 'Lesson', 'レッスン')}
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {localizedLessonTitle(lesson, language)}
                </option>
              ))}
            </SelectField>
            <div className="form-grid">
              <SelectField
                label={t('Тип написания', 'Script type', '文字種')}
                value={script}
                onChange={(e) => setScript(e.target.value as JapaneseScriptType)}
              >
                <option value="kanji">{t('Кандзи', 'Kanji', '漢字')}</option>
                <option value="hiragana">{t('Хирагана', 'Hiragana', 'ひらがな')}</option>
                <option value="katakana">{t('Катакана', 'Katakana', 'カタカナ')}</option>
                <option value="mixed">{t('Смешанное', 'Mixed', '混在')}</option>
              </SelectField>
              <SelectField
                label={t('Статус', 'Status', '状態')}
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
              >
                <option value="draft">{t('Черновик', 'Draft', '下書き')}</option>
                <option value="published">{t('Опубликовано', 'Published', '公開')}</option>
                <option value="archived">{t('Архив', 'Archived', 'アーカイブ')}</option>
              </SelectField>
            </div>
            <Field
              label={t('Допустимые варианты ромадзи', 'Accepted romaji variants', 'ローマ字の別表記')}
              value={accepted}
              onChange={(e) => setAccepted(e.target.value)}
              hint={t('Через запятую', 'Comma separated', 'カンマ区切り')}
            />
            <Field label={t('Подсказка', 'Hint', 'ヒント')} value={hint} onChange={(e) => setHint(e.target.value)} />
            <fieldset className="category-field">
              <legend>{t('Категории', 'Categories', 'カテゴリー')}</legend>
              {categories.map((category) => (
                <label key={category.id}>
                  <input
                    type="checkbox"
                    checked={categoryIds.includes(category.id)}
                    onChange={() =>
                      setCategoryIds((items) =>
                        items.includes(category.id)
                          ? items.filter((id) => id !== category.id)
                          : [...items, category.id],
                      )
                    }
                  />
                  {localizedCategoryName(category, language)}
                </label>
              ))}
            </fieldset>
          </div>
          <div>
            <div className="vocabulary-preview">
              <span className="eyebrow">{t('Предпросмотр карточки', 'Card preview', 'カードのプレビュー')}</span>
              <strong>{japanese || '日本語'}</strong>
              <p>{romaji || 'romaji'}</p>
              <h3>{english || 'English meaning'}</h3>
              {hint && <small>{hint}</small>}
            </div>
            <h3 className="form-subtitle">{t('Пример употребления', 'Usage example', '例文')}</h3>
            <Field
              label={t('Японский', 'Japanese', '日本語')}
              value={exampleJa}
              onChange={(e) => setExampleJa(e.target.value)}
            />
            <Field
              label={t('Ромадзи', 'Romaji', 'ローマ字')}
              value={exampleRo}
              onChange={(e) => setExampleRo(e.target.value)}
            />
            <Field
              label={t('Английский перевод', 'English translation', '英訳')}
              value={exampleEn}
              onChange={(e) => setExampleEn(e.target.value)}
            />
          </div>
        </div>
        <footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('Отмена', 'Cancel', 'キャンセル')}
          </Button>
          <Button type="submit">
            {status === 'draft'
              ? t('Сохранить черновик', 'Save draft', '下書きを保存')
              : t('Сохранить', 'Save', '保存')}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}

interface BulkRow {
  japanese: string;
  romaji: string;
  english: string;
  lessonId: string;
  category?: string;
  duplicate: boolean;
  valid: boolean;
}
function BulkDialog({
  lessons,
  existing,
  onClose,
  onSave,
}: {
  lessons: ReturnType<typeof useAppStore.getState>['lessons'];
  existing: VocabularyEntry[];
  onClose: () => void;
  onSave: (entries: VocabularyEntry[]) => void;
}) {
  const { language, t } = useI18n();
  const [text, setText] = useState('');
  const [defaultLesson, setDefaultLesson] = useState(lessons[0]?.id ?? '');
  const rows = useMemo<BulkRow[]>(
    () =>
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const parts = line.split(/\t|;/).map((item) => item.trim());
          const lesson = lessons.find((item) => item.id === parts[3] || item.title === parts[3]);
          const lessonId = lesson?.id ?? defaultLesson;
          return {
            japanese: parts[0] ?? '',
            romaji: parts[1] ?? '',
            english: parts[2] ?? '',
            lessonId,
            category: parts[4],
            valid: Boolean(parts[0] && parts[1] && parts[2] && lessonId),
            duplicate: existing.some((item) => item.japanese === parts[0] && item.lessonId === lessonId),
          };
        }),
    [text, lessons, defaultLesson, existing],
  );
  const valid = rows.filter((row) => row.valid && !row.duplicate);
  function save() {
    const now = new Date().toISOString();
    onSave(
      valid.map((row) => ({
        id: crypto.randomUUID(),
        lessonId: row.lessonId,
        japanese: row.japanese,
        romaji: row.romaji,
        englishMeaning: row.english,
        acceptedRomaji: [],
        scriptType: /[一-龯々]/u.test(row.japanese)
          ? 'mixed'
          : /[ァ-ヺー]/u.test(row.japanese)
            ? 'katakana'
            : 'hiragana',
        categoryIds: [],
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      })),
    );
  }
  return (
    <Dialog title={t('Массовое добавление', 'Bulk add', '一括追加')} onClose={onClose} wide>
      <div className="bulk-dialog">
        <p>
          {t(
            'Вставьте строки с колонками через табуляцию или точку с запятой:',
            'Paste rows with tab- or semicolon-separated columns:',
            'タブまたはセミコロン区切りの行を貼り付けてください:',
          )}
        </p>
        <code>
          {t(
            '日本語 | romaji | English meaning | урок (необязательно)',
            '日本語 | romaji | English meaning | lesson (optional)',
            '日本語 | romaji | English meaning | レッスン（任意）',
          )}
        </code>
        <SelectField
          label={t('Урок по умолчанию', 'Default lesson', '既定のレッスン')}
          value={defaultLesson}
          onChange={(e) => setDefaultLesson(e.target.value)}
        >
          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {localizedLessonTitle(lesson, language)}
            </option>
          ))}
        </SelectField>
        <label className="field">
          <span>{t('Данные', 'Data', 'データ')}</span>
          <textarea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'友達\ttomodachi\tfriend\n駅;eki;station'}
          />
        </label>
        {rows.length > 0 && (
          <div className="import-preview">
            <div>
              <strong>{valid.length}</strong>
              <span>{t('будет добавлено', 'to add', '追加予定')}</span>
            </div>
            <div>
              <strong>{rows.filter((row) => row.duplicate).length}</strong>
              <span>{t('дубликатов', 'duplicates', '重複')}</span>
            </div>
            <div>
              <strong>{rows.filter((row) => !row.valid).length}</strong>
              <span>{t('с ошибками', 'invalid', 'エラー')}</span>
            </div>
          </div>
        )}
        <footer>
          <Button variant="ghost" onClick={onClose}>
            {t('Отмена', 'Cancel', 'キャンセル')}
          </Button>
          <Button onClick={save} disabled={!valid.length}>
            {t('Добавить как черновики', 'Add as drafts', '下書きとして追加')}
          </Button>
        </footer>
      </div>
    </Dialog>
  );
}
