import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppStore } from '../store/app-store';
import { Layout } from './Layout';
import { Dashboard } from './pages/Dashboard';
import { Practice } from './pages/Practice';
import { Quiz } from './pages/Quiz';
import { Results } from './pages/Results';
import { Statistics } from './pages/Statistics';
import { Lessons } from './pages/Lessons';
import { Editor } from './pages/Editor';
import { SettingsPage } from './pages/SettingsPage';
import { useI18n } from './i18n';

export function App() {
  const { t } = useI18n();
  const hydrate = useAppStore((state) => state.hydrate);
  const hydrated = useAppStore((state) => state.hydrated);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  if (!hydrated)
    return (
      <div className="loading">
        <span>言</span>
        <p>{t('Готовим ваши уроки…', 'Preparing your lessons…', 'レッスンを準備しています…')}</p>
      </div>
    );
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/stats" element={<Statistics />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/editor" element={<Editor />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
