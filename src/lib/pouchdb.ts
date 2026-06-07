import PouchDB from 'pouchdb-browser'
import type { Session, TeamSession } from '../core/types'

const sessionsDb = new PouchDB<Session>('cogNav_sessions')
const teamSessionsDb = new PouchDB<TeamSession>('cogNav_teamSessions')

export async function saveSession(session: Session): Promise<void> {
  const existing = await sessionsDb.get(session.id).catch(() => null)
  if (existing) {
    await sessionsDb.put({ ...session, _id: session.id, _rev: existing._rev })
  } else {
    await sessionsDb.put({ ...session, _id: session.id })
  }
}

export async function getSession(id: string): Promise<Session | null> {
  return sessionsDb.get(id).catch(() => null)
}

export async function getAllSessions(): Promise<Session[]> {
  const result = await sessionsDb.allDocs({ include_docs: true, descending: true })
  return result.rows.map(r => r.doc as Session).filter(Boolean)
}

export async function saveTeamSession(session: TeamSession): Promise<void> {
  const existing = await teamSessionsDb.get(session.id).catch(() => null)
  if (existing) {
    await teamSessionsDb.put({ ...session, _id: session.id, _rev: existing._rev })
  } else {
    await teamSessionsDb.put({ ...session, _id: session.id })
  }
}

export async function getTeamSession(id: string): Promise<TeamSession | null> {
  return teamSessionsDb.get(id).catch(() => null)
}

export async function getAllTeamSessions(): Promise<TeamSession[]> {
  const result = await teamSessionsDb.allDocs({ include_docs: true, descending: true })
  return result.rows.map(r => r.doc as TeamSession).filter(Boolean)
}
