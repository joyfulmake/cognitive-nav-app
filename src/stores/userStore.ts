import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppMode, ExamBoard, DepthLayer } from '../core/types'
import { getOrCreateLocalProfile, updateProfile } from '../lib/identity'

interface UserState {
  userId: string | null
  name: string | null
  preferredMode: AppMode
  preferredExamBoard: ExamBoard
  conceptCoverage: Record<string, DepthLayer>
  isLoading: boolean
  initProfile: (name?: string) => Promise<void>
  setName: (name: string) => void
  setPreferredMode: (mode: AppMode) => void
  setPreferredExamBoard: (board: ExamBoard) => void
  updateConceptCoverage: (concept: string, depth: DepthLayer) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: null,
      name: null,
      preferredMode: 'epistemic',
      preferredExamBoard: 'general',
      conceptCoverage: {},
      isLoading: false,

      initProfile: async (name) => {
        set({ isLoading: true })
        const profile = await getOrCreateLocalProfile(name)
        set({
          userId: profile.id,
          name: profile.name,
          preferredMode: profile.preferredMode,
          preferredExamBoard: profile.preferredExamBoard,
          conceptCoverage: profile.conceptCoverage,
          isLoading: false,
        })
      },

      setName: (name) => {
        set({ name })
        updateProfile({ name })
      },

      setPreferredMode: (mode) => {
        set({ preferredMode: mode })
        updateProfile({ preferredMode: mode })
      },

      setPreferredExamBoard: (board) => {
        set({ preferredExamBoard: board })
        updateProfile({ preferredExamBoard: board })
      },

      updateConceptCoverage: (concept, depth) => {
        const prev = get().conceptCoverage
        if ((prev[concept] ?? 0) < depth) {
          const updated = { ...prev, [concept]: depth }
          set({ conceptCoverage: updated })
          updateProfile({ conceptCoverage: updated })
        }
      },
    }),
    {
      name: 'cogNav-user',
      partialize: (s) => ({
        userId: s.userId,
        name: s.name,
        preferredMode: s.preferredMode,
        preferredExamBoard: s.preferredExamBoard,
        conceptCoverage: s.conceptCoverage,
      }),
    }
  )
)
