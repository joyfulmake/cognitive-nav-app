import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, AppMode, ExamBoard, DepthLayer, Reformulation, SessionMode } from '../core/types'
import { getActiveGate, MASTERY_REQUIRED } from '../core/depthRubric'
import { saveSession, getAllSessions } from '../lib/db'

interface SessionState {
  sessions: Session[]
  activeSession: Session | null
  loadSessions: () => Promise<void>
  startSession: (topic: string, appMode: AppMode, targetDepth: DepthLayer, examBoard?: ExamBoard, userId?: string, vignette?: string, sessionMode?: SessionMode) => Session
  addReformulation: (sessionId: string, reformulation: Reformulation) => void
  completeSession: (sessionId: string) => void
  clearActive: () => void
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      activeSession: null,

      loadSessions: async () => {
        const all = await getAllSessions()
        set({ sessions: all })
      },

      startSession: (topic, appMode, targetDepth, examBoard, userId, vignette, sessionMode) => {
        const session: Session = {
          id: makeId(),
          userId: userId ?? null,
          appMode,
          topic,
          examBoard,
          targetDepth,
          levelMastery: {},
          reformulations: [],
          trajectoryVector: [],
          currentDepth: 1,
          isComplete: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          offlineCreated: !navigator.onLine,
          sessionMode: sessionMode ?? 'topic',
          vignette,
        }
        saveSession(session)
        set(s => ({ sessions: [session, ...s.sessions], activeSession: session }))
        return session
      },

      addReformulation: (sessionId, reformulation) => {
        set(s => {
          const updated = s.sessions.map(sess => {
            if (sess.id !== sessionId) return sess

            const activeGate = getActiveGate(sess.levelMastery, sess.targetDepth)
            // L1 target: any question qualifies (depthScore always >= 1)
            const qualifies = reformulation.depthScore >= activeGate

            const newMastery: Partial<Record<DepthLayer, number>> = { ...sess.levelMastery }
            if (qualifies) {
              const current = newMastery[activeGate] ?? 0
              newMastery[activeGate] = Math.min(current + 1, MASTERY_REQUIRED)
            }

            const newTraj = [...sess.trajectoryVector, reformulation.depthScore] as DepthLayer[]
            const result: Session = {
              ...sess,
              reformulations: [...sess.reformulations, reformulation],
              trajectoryVector: newTraj,
              currentDepth: reformulation.depthScore,
              levelMastery: newMastery,
              updatedAt: Date.now(),
            }
            saveSession(result)
            return result
          })
          const active = updated.find(s => s.id === sessionId) ?? null
          return { sessions: updated, activeSession: active }
        })
      },

      completeSession: (sessionId) => {
        set(s => {
          const updated = s.sessions.map(sess => {
            if (sess.id !== sessionId) return sess
            const done = { ...sess, isComplete: true, updatedAt: Date.now() }
            saveSession(done)
            return done
          })
          return { sessions: updated }
        })
      },

      clearActive: () => set({ activeSession: null }),
    }),
    {
      name: 'cogNav-sessions',
      partialize: (s) => ({ sessions: s.sessions }),
    }
  )
)
