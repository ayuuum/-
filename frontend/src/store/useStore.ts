import { create } from 'zustand';
import type { AppState } from '../types';

export const useStore = create<AppState>((set) => ({
    profile: null,
    generations: [],
    isGenerating: false,
    setProfile: (profile) => set({ profile }),
    setGenerations: (generations) => set({ generations }),
    addGeneration: (generation) =>
        set((state) => ({ generations: [generation, ...state.generations] })),
    updateGeneration: (id, updates) =>
        set((state) => ({
            generations: state.generations.map((gen) =>
                gen.id === id ? { ...gen, ...updates } : gen
            ),
        })),
    setIsGenerating: (isGenerating) => set({ isGenerating }),
}));
