import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, Database, House, Menu, Moon, Settings, Sparkles, Sun, X } from 'lucide-react';
import { useAppStore } from '../store/app-store';
import type { InterfaceLanguage } from '../domain/types';
import { useI18n } from './i18n';
import { useTheme } from './theme';

const navigation = [
  { to: '/', labels: ['Главная', 'Home', 'ホーム'], icon: House },
  { to: '/practice', labels: ['Тренировка', 'Practice', '練習'], icon: Sparkles },
  { to: '/stats', labels: ['Статистика', 'Statistics', '統計'], icon: BarChart3 },
  { to: '/lessons', labels: ['Уроки', 'Lessons', 'レッスン'], icon: BookOpen },
  { to: '/editor', labels: ['Редактор', 'Editor', '編集'], icon: Database },
  { to: '/settings', labels: ['Настройки', 'Settings', '設定'], icon: Settings },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const notice = useAppStore((state) => state.notice);
  const setNotice = useAppStore((state) => state.setNotice);
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const languageIndex = language === 'ru' ? 0 : language === 'en' ? 1 : 2;

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="brand">
          <span>言</span>
          <div>
            <strong>Kotoba</strong>
            <small>STUDIO</small>
          </div>
        </div>
        <div
          className="language-switcher"
          role="group"
          aria-label={t('Язык интерфейса', 'Interface language', '表示言語')}
        >
          {(['ru', 'en', 'ja'] as InterfaceLanguage[]).map((code) => (
            <button
              key={code}
              className={language === code ? 'is-active' : ''}
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
            >
              {code === 'ru' ? 'RU' : code === 'en' ? 'EN' : '日本語'}
            </button>
          ))}
        </div>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-pressed={theme === 'dark'}
          aria-label={t('Переключить тему', 'Toggle theme', 'テーマを切り替える')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>
            {t(
              theme === 'dark' ? 'Светлая тема' : 'Тёмная тема',
              theme === 'dark' ? 'Light theme' : 'Dark theme',
              theme === 'dark' ? 'ライトテーマ' : 'ダークテーマ',
            )}
          </span>
        </button>
        <nav aria-label={t('Основная навигация', 'Main navigation', 'メインナビゲーション')}>
          <p>{t('Учёба', 'Study', '学習')}</p>
          {navigation.slice(0, 3).map(({ to, labels, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <Icon size={19} />
              {labels[languageIndex]}
            </NavLink>
          ))}
          <p>{t('Материалы', 'Materials', '教材')}</p>
          {navigation.slice(3).map(({ to, labels, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}>
              <Icon size={19} />
              {labels[languageIndex]}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>自主学習</span>
          <strong>{t('Учись в своём ритме', 'Learn at your own pace', '自分のペースで学ぶ')}</strong>
          <small>
            {t(
              'Все данные остаются в браузере.',
              'All data stays in your browser.',
              'データはブラウザ内に保存されます。',
            )}
          </small>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label={t('Закрыть меню', 'Close menu', 'メニューを閉じる')}
        />
      )}
      <div className="main-area">
        <header className="mobile-header">
          <button
            className="icon-button"
            onClick={() => setOpen(true)}
            aria-label={t('Открыть меню', 'Open menu', 'メニューを開く')}
          >
            <Menu />
          </button>
          <strong>Kotoba Studio</strong>
          <span>{location.pathname === '/' ? '今日' : '学ぶ'}</span>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      {notice && (
        <button className="toast" onClick={() => setNotice(null)} aria-live="polite">
          {notice}
          <X size={16} />
        </button>
      )}
    </div>
  );
}
