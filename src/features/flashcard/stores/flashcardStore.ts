import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/shared/utils/mmkvStorage';
import { KeyValueItem } from '@/domain/entities/Vocabulary';
import { getRandomFlashcardUseCase, markAsMemorizedUseCase, markAsNotMemorizedUseCase } from '@/shared/di/container';

interface FlashcardState {
  currentCard: KeyValueItem | null;
  isFlipped: boolean;
  
  // Actions
  loadNextCard: () => Promise<void>;
  flipCard: () => void;
  markAsMemorized: () => Promise<void>;
  markAsNotMemorized: () => Promise<void>;
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      currentCard: null,
      isFlipped: false,

      loadNextCard: async () => {
        const nextCard = await getRandomFlashcardUseCase.execute();
        set({ currentCard: nextCard, isFlipped: false });
      },

      flipCard: () => set((state) => ({ isFlipped: !state.isFlipped })),

      markAsMemorized: async () => {
        const card = get().currentCard;
        if (!card) return;
        await markAsMemorizedUseCase.execute(card.id);
        await get().loadNextCard();
      },

      markAsNotMemorized: async () => {
        const card = get().currentCard;
        if (!card) return;
        await markAsNotMemorizedUseCase.execute(card.id);
        await get().loadNextCard();
      },
    }),
    {
      name: 'flashcard-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        // We only persist metadata if needed, but for MVP let's store state
      }),
    }
  )
);
