import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Copy, Edit3, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { Lesson } from '../../domain/types';
import { useAppStore } from '../../store/app-store';
import { Button, Dialog, Field, PageHeader } from '../components/UI';
import { localizedLessonDescription, localizedLessonTitle, useI18n } from '../i18n';

export function Lessons() {
  const { lessons, vocabulary, saveLesson, deleteLesson, setNotice } = useAppStore();
  const { language, t, dateLocale } = useI18n();
  const [editing, setEditing] = useState<Lesson | 'new' | null>(null);
  const ordered = [...lessons].sort((a, b) => a.order - b.order);

  function duplicate(lesson: Lesson) {
    const now = new Date().toISOString();
    const copy = {
      ...lesson,
      id: crypto.randomUUID(),
      title: `${lesson.title} — ${t('копия', 'copy', 'コピー')}`,
      order: lessons.length + 1,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };
    saveLesson(copy);
    setNotice(
      t(
        'Копия урока создана как черновик.',
        'A lesson copy was created as a draft.',
        'レッスンのコピーを下書きとして作成しました。',
      ),
    );
  }
  function move(lesson: Lesson, delta: number) {
    const target = ordered[ordered.findIndex((item) => item.id === lesson.id) + delta];
    if (!target) return;
    saveLesson({ ...lesson, order: target.order, updatedAt: new Date().toISOString() });
    saveLesson({ ...target, order: lesson.order, updatedAt: new Date().toISOString() });
  }
  function remove(lesson: Lesson) {
    const count = vocabulary.filter((word) => word.lessonId === lesson.id).length;
    if (
      window.confirm(
        count
          ? t(
              `В уроке ${count} слов. Удалить урок вместе со словами?`,
              `This lesson has ${count} words. Delete the lesson and its words?`,
              `このレッスンには${count}語あります。単語と一緒に削除しますか？`,
            )
          : t('Удалить этот урок?', 'Delete this lesson?', 'このレッスンを削除しますか？'),
      )
    )
      deleteLesson(lesson.id);
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={t('Управление контентом', 'Content management', 'コンテンツ管理')}
        title={t('Уроки', 'Lessons', 'レッスン')}
        text={t(
          'Публикуйте готовые материалы, меняйте порядок и создавайте новые тематические блоки.',
          'Publish ready material, change the order and create new topic blocks.',
          '教材の公開・並べ替え・新しいテーマの作成ができます。',
        )}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} /> {t('Новый урок', 'New lesson', '新しいレッスン')}
          </Button>
        }
      />
      <div className="lesson-admin-list">
        {ordered.map((lesson, index) => {
          const words = vocabulary.filter((item) => item.lessonId === lesson.id);
          const published = words.filter((item) => item.status === 'published').length;
          const drafts = words.filter((item) => item.status === 'draft').length;
          return (
            <article key={lesson.id}>
              <div className="lesson-order" style={{ background: lesson.color }}>
                <strong>{String(index + 1).padStart(2, '0')}</strong>
                <div>
                  <button
                    disabled={index === 0}
                    onClick={() => move(lesson, -1)}
                    aria-label={t('Поднять', 'Move up', '上へ')}
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    disabled={index === ordered.length - 1}
                    onClick={() => move(lesson, 1)}
                    aria-label={t('Опустить', 'Move down', '下へ')}
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </div>
              <div className="lesson-admin-copy">
                <div className="lesson-status">
                  <span className={lesson.isPublished ? 'status-dot published' : 'status-dot'} />
                  {lesson.isPublished ? t('Опубликован', 'Published', '公開中') : t('Скрыт', 'Hidden', '非公開')}
                </div>
                <h2>{localizedLessonTitle(lesson, language)}</h2>
                <p>
                  {localizedLessonDescription(lesson, language) ||
                    t('Описание не добавлено', 'No description', '説明はありません')}
                </p>
                <dl>
                  <div>
                    <dt>{t('Опубликовано', 'Published', '公開')}</dt>
                    <dd>{published}</dd>
                  </div>
                  <div>
                    <dt>{t('Черновики', 'Drafts', '下書き')}</dt>
                    <dd>{drafts}</dd>
                  </div>
                  <div>
                    <dt>{t('Изменён', 'Updated', '更新日')}</dt>
                    <dd>{new Date(lesson.updatedAt).toLocaleDateString(dateLocale)}</dd>
                  </div>
                </dl>
              </div>
              <div className="row-actions">
                <button
                  onClick={() =>
                    saveLesson({ ...lesson, isPublished: !lesson.isPublished, updatedAt: new Date().toISOString() })
                  }
                  title={
                    lesson.isPublished
                      ? t('Снять с публикации', 'Unpublish', '非公開にする')
                      : t('Опубликовать', 'Publish', '公開する')
                  }
                >
                  {lesson.isPublished ? <EyeOff /> : <Eye />}
                </button>
                <button onClick={() => setEditing(lesson)} title={t('Редактировать', 'Edit', '編集')}>
                  <Edit3 />
                </button>
                <button onClick={() => duplicate(lesson)} title={t('Дублировать', 'Duplicate', '複製')}>
                  <Copy />
                </button>
                <button className="danger" onClick={() => remove(lesson)} title={t('Удалить', 'Delete', '削除')}>
                  <Trash2 />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {editing && (
        <LessonDialog
          lesson={editing === 'new' ? null : editing}
          order={lessons.length + 1}
          onClose={() => setEditing(null)}
          onSave={(lesson) => {
            saveLesson(lesson);
            setEditing(null);
            setNotice(t('Урок сохранён.', 'Lesson saved.', 'レッスンを保存しました。'));
          }}
        />
      )}
    </div>
  );
}

function LessonDialog({
  lesson,
  order,
  onClose,
  onSave,
}: {
  lesson: Lesson | null;
  order: number;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [description, setDescription] = useState(lesson?.description ?? '');
  const [color, setColor] = useState(lesson?.color ?? '#be4138');
  const [published, setPublished] = useState(lesson?.isPublished ?? false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: lesson?.id ?? crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      order: lesson?.order ?? order,
      color,
      isPublished: published,
      createdAt: lesson?.createdAt ?? now,
      updatedAt: now,
    });
  }
  return (
    <Dialog
      title={
        lesson
          ? t('Редактировать урок', 'Edit lesson', 'レッスンを編集')
          : t('Новый урок', 'New lesson', '新しいレッスン')
      }
      onClose={onClose}
    >
      <form className="dialog-form" onSubmit={submit}>
        <Field
          label={t('Название', 'Title', 'タイトル')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />
        <label className="field">
          <span>{t('Описание', 'Description', '説明')}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label className="color-field">
          <span>{t('Цвет урока', 'Lesson colour', 'レッスンの色')}</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <code>{color}</code>
        </label>
        <label className="toggle-row compact">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span />
          <div>
            <strong>{t('Опубликовать урок', 'Publish lesson', 'レッスンを公開')}</strong>
            <small>
              {t(
                'Черновики слов всё равно останутся скрыты.',
                'Draft words remain hidden.',
                '下書きの単語は非表示のままです。',
              )}
            </small>
          </div>
        </label>
        <footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('Отмена', 'Cancel', 'キャンセル')}
          </Button>
          <Button type="submit">{t('Сохранить', 'Save', '保存')}</Button>
        </footer>
      </form>
    </Dialog>
  );
}
