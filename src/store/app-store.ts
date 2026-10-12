import { create } from 'zustand';
import type { AppSnapshot, LearningSession, Lesson, SessionAnswer, Settings, VocabularyEntry } from '../domain/types';
import { initialSnapshot } from '../data/seed';
import { migrateSnapshot } from '../data/migrate';
import { clearDatabase, loadSnapshot, saveSnapshot } from '../infrastructure/idb';
import { updateProgress } from '../domain/learning';

interface AppActions {
  hydrated: boolean;
  notice: string | null;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  setNotice: (notice: string | null) => void;
  saveLesson: (lesson: Lesson) => void;
  deleteLesson: (id: string) => void;
  saveVocabulary: (entry: VocabularyEntry) => void;
  saveVocabularyMany: (entries: VocabularyEntry[]) => void;
  deleteVocabulary: (id: string) => void;
  setCurrentSession: (session: LearningSession | null) => void;
  recordAnswer: (answer: SessionAnswer) => void;
  completeSession: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  replaceSnapshot: (snapshot: AppSnapshot) => void;
  resetAll: () => Promise<void>;
}

export type AppStore = AppSnapshot & AppActions;

function snapshot(state: AppStore): AppSnapshot {
  return {
    contentVersion: state.contentVersion ?? initialSnapshot.contentVersion,
    lessons: state.lessons,
    vocabulary: state.vocabulary,
    categories: state.categories,
    progress: state.progress,
    sessions: state.sessions,
    currentSession: state.currentSession,
    settings: state.settings,
    initialized: true,
  };
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;
function schedulePersist(get: () => AppStore): void {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    void saveSnapshot(snapshot(get()));
  }, 80);
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...structuredClone(initialSnapshot),
  hydrated: false,
  notice: null,
  hydrate: async () => {
    try {
      const saved = await loadSnapshot();
      const next = saved ? migrateSnapshot(saved) : structuredClone(initialSnapshot);
      set({ ...next, hydrated: true });
      if (!saved || next !== saved) await saveSnapshot(snapshot(get()));
    } catch {
      set({
        ...structuredClone(initialSnapshot),
        hydrated: true,
        notice: 'IndexedDB недоступна. Данные сохранятся только до закрытия вкладки.',
      });
    }
  },
  persist: async () => saveSnapshot(snapshot(get())),
  setNotice: (notice) => set({ notice }),
  saveLesson: (lesson) => {
    set((state) => ({
      lessons: state.lessons.some((item) => item.id === lesson.id)
        ? state.lessons.map((item) => (item.id === lesson.id ? lesson : item))
        : [...state.lessons, lesson],
    }));
    schedulePersist(get);
  },
  deleteLesson: (id) => {
    set((state) => ({
      lessons: state.lessons.filter((item) => item.id !== id),
      vocabulary: state.vocabulary.filter((item) => item.lessonId !== id),
    }));
    schedulePersist(get);
  },
  saveVocabulary: (entry) => {
    set((state) => ({
      vocabulary: state.vocabulary.some((item) => item.id === entry.id)
        ? state.vocabulary.map((item) => (item.id === entry.id ? entry : item))
        : [...state.vocabulary, entry],
    }));
    schedulePersist(get);
  },
  saveVocabularyMany: (entries) => {
    set((state) => ({ vocabulary: [...state.vocabulary, ...entries] }));
    schedulePersist(get);
  },
  deleteVocabulary: (id) => {
    set((state) => ({ vocabulary: state.vocabulary.filter((item) => item.id !== id) }));
    schedulePersist(get);
  },
  setCurrentSession: (currentSession) => {
    set({ currentSession });
    schedulePersist(get);
  },
  recordAnswer: (answer) => {
    set((state) => {
      if (!state.currentSession) return state;
      const previous = state.progress.find((item) => item.vocabularyId === answer.vocabularyId);
      const nextProgress = updateProgress(previous, answer.vocabularyId, answer.isCorrect);
      return {
        currentSession: { ...state.currentSession, answers: [...state.currentSession.answers, answer] },
        progress: [...state.progress.filter((item) => item.vocabularyId !== answer.vocabularyId), nextProgress],
      };
    });
    schedulePersist(get);
  },
  completeSession: () => {
    set((state) => {
      if (!state.currentSession) return state;
      const completed: LearningSession = { ...state.currentSession, completedAt: new Date().toISOString() };
      return { sessions: [completed, ...state.sessions].slice(0, 100), currentSession: completed };
    });
    schedulePersist(get);
  },
  updateSettings: (settings) => {
    set((state) => ({ settings: { ...state.settings, ...settings } }));
    schedulePersist(get);
  },
  replaceSnapshot: (next) => {
    set({ ...next, hydrated: true });
    schedulePersist(get);
  },
  resetAll: async () => {
    await clearDatabase();
    const next = structuredClone(initialSnapshot);
    set({ ...next, hydrated: true });
    await saveSnapshot(next);
  },
}));
