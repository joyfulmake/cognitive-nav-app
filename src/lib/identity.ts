import PouchDB from 'pouchdb-browser'
import type { UserProfile } from '../core/types'

const profileDb = new PouchDB<UserProfile>('cogNav_profiles')

function makeId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function getOrCreateLocalProfile(name?: string): Promise<UserProfile> {
  const all = await profileDb.allDocs({ include_docs: true, limit: 1 })
  if (all.rows.length > 0 && all.rows[0].doc) {
    return all.rows[0].doc as UserProfile
  }
  const profile: UserProfile = {
    id: makeId(),
    email: '',
    name: name ?? 'Seeker',
    preferredMode: 'epistemic',
    preferredExamBoard: 'general',
    conceptCoverage: {},
    totalSessions: 0,
    createdAt: new Date().toISOString(),
  }
  await profileDb.put({ ...profile, _id: profile.id })
  return profile
}

export async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
  const all = await profileDb.allDocs({ include_docs: true, limit: 1 })
  if (all.rows.length === 0) return
  const existing = all.rows[0].doc as UserProfile & { _id: string; _rev: string }
  await profileDb.put({ ...existing, ...updates })
}

export async function getLocalProfile(): Promise<UserProfile | null> {
  const all = await profileDb.allDocs({ include_docs: true, limit: 1 })
  return all.rows.length > 0 ? (all.rows[0].doc as UserProfile) : null
}
