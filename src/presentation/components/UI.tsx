import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';

export function Button({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button className={`button button--${variant} ${className}`} {...props} />;
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function SelectField({
  label,
  children,
  value,
  onChange,
  disabled,
}: {
  label: string;
  children: ReactNode;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={onChange} disabled={disabled}>
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'red' | 'green' | 'gold' | 'blue';
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-wrap" aria-label={label}>
      <div className="progress-meta">
        <span>{label}</span>
        <strong>{Math.round(safe)}%</strong>
      </div>
      <div className="progress">
        <span style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-kana">空</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`dialog ${wide ? 'dialog--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header>
          <h2 id="dialog-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label={t('Закрыть', 'Close', '閉じる')}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  text,
  actions,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function StatCard({
  value,
  label,
  detail,
  accent = false,
}: {
  value: string | number;
  label: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <article className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <small>{detail}</small>}
    </article>
  );
}
