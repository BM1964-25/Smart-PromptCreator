import { create } from 'zustand';
import type { PromptMode } from '../types/domain';

interface AppState {
  activeTabId?: string;
  activeCategoryId?: string;
  selectedPromptId?: string;
  search: string;
  favoriteOnly: boolean;
  optimizerMode: PromptMode;
  setActiveTab: (id?: string) => void;
  setActiveCategory: (id?: string) => void;
  setSelectedPrompt: (id?: string) => void;
  setSearch: (value: string) => void;
  setFavoriteOnly: (value: boolean) => void;
  setOptimizerMode: (mode: PromptMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  search: '',
  favoriteOnly: false,
  optimizerMode: 'gpt',
  setActiveTab: (activeTabId) => set({ activeTabId, activeCategoryId: undefined, selectedPromptId: undefined }),
  setActiveCategory: (activeCategoryId) => set({ activeCategoryId, selectedPromptId: undefined }),
  setSelectedPrompt: (selectedPromptId) => set({ selectedPromptId }),
  setSearch: (search) => set({ search }),
  setFavoriteOnly: (favoriteOnly) => set({ favoriteOnly }),
  setOptimizerMode: (optimizerMode) => set({ optimizerMode })
}));
