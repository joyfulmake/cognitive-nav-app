import Dexie, { type Table } from 'dexie'
import type { Session, TeamSession } from '../core/types'

// ─── Voice preference stored locally ─────────────────────────────────────────

export interface VoicePreference {
  id: 'user'
  language: string        // BCP-47: 'en-US', 'hi-IN', 'es-ES', 'ar-SA', etc.
  voiceName: string       // Guide/narrator voice name (from speechSynthesis.getVoices())
  learnerVoiceName?: string // Learner/student voice name for dialogue mode
  rate: number            // 0.6 – 1.4
  pitch: number           // 0.7 – 1.4
  preset: 'calm' | 'warm' | 'energetic' | 'teacher' | 'custom'
  elGuideVoiceId?: string    // ElevenLabs voice ID override for guide role
  elLearnerVoiceId?: string  // ElevenLabs voice ID override for learner role
}

// ─── FSRS card for spaced repetition ─────────────────────────────────────────

export interface FsrsCard {
  id: string              // `${appMode}:${topic}:L${targetDepth}`
  topic: string
  appMode: string
  targetDepth: number
  due: number             // Unix timestamp (ms)
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  state: number           // 0=New 1=Learning 2=Review 3=Relearning
  lastReview?: number
}

// ─── TTS audio cache (ElevenLabs / any provider) ─────────────────────────────

export interface TTSCache {
  key: string          // `${voiceId}:${simpleHash(text)}`
  audio: ArrayBuffer   // raw MP3 bytes — stored as ArrayBuffer to avoid Uint8Array offset issues
  createdAt: number
}

// ─── Dexie schema ─────────────────────────────────────────────────────────────

class CogNavDB extends Dexie {
  sessions!:     Table<Session>
  teamSessions!: Table<TeamSession>
  voicePrefs!:   Table<VoicePreference>
  fsrsCards!:    Table<FsrsCard>
  ttsCache!:     Table<TTSCache>

  constructor() {
    super('CogNavDB')
    this.version(1).stores({
      sessions:     'id, userId, appMode, targetDepth, createdAt, isComplete, updatedAt',
      teamSessions: 'id, createdAt',
      voicePrefs:   'id',
      fsrsCards:    'id, topic, due',
    })
    this.version(2).stores({
      sessions:     'id, userId, appMode, targetDepth, createdAt, isComplete, updatedAt',
      teamSessions: 'id, createdAt',
      voicePrefs:   'id',
      fsrsCards:    'id, topic, due',
      ttsCache:     'key, createdAt',
    })
  }
}

export const db = new CogNavDB()

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export async function getSession(id: string): Promise<Session | null> {
  return (await db.sessions.get(id)) ?? null
}

export async function getAllSessions(): Promise<Session[]> {
  return db.sessions.orderBy('createdAt').reverse().toArray()
}

// ─── Team session helpers ─────────────────────────────────────────────────────

export async function saveTeamSession(ts: TeamSession): Promise<void> {
  await db.teamSessions.put(ts)
}

export async function getTeamSession(id: string): Promise<TeamSession | null> {
  return (await db.teamSessions.get(id)) ?? null
}

export async function getAllTeamSessions(): Promise<TeamSession[]> {
  return db.teamSessions.orderBy('createdAt').reverse().toArray()
}

// ─── Voice preference helpers ─────────────────────────────────────────────────

export const DEFAULT_VOICE_PREF: VoicePreference = {
  id: 'user',
  language: 'en-US',
  voiceName: '',
  rate: 0.88,
  pitch: 1.12,
  preset: 'warm',
}

export async function getVoicePrefs(): Promise<VoicePreference> {
  return (await db.voicePrefs.get('user')) ?? DEFAULT_VOICE_PREF
}

export async function saveVoicePrefs(prefs: Omit<VoicePreference, 'id'>): Promise<void> {
  await db.voicePrefs.put({ id: 'user', ...prefs })
}
