import {
  collection, doc, setDoc, getDocs,
  query, orderBy, limit, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { firestore, firebaseEnabled } from './firebase'
import { db, saveSession } from './db'
import type { Session } from '../core/types'

// ─── Upload local sessions to Firestore ──────────────────────────────────────

export async function pushSessionsToCloud(userId: string, sessions: Session[]): Promise<void> {
  if (!firebaseEnabled || !firestore) return
  // Push the most recent 100 sessions
  const toSync = sessions.slice(0, 100)
  const writes = toSync.map(s =>
    setDoc(doc(firestore!, 'users', userId, 'sessions', s.id), { ...s, userId }, { merge: true })
  )
  await Promise.allSettled(writes)
}

// ─── Pull cloud sessions and merge into local Dexie ──────────────────────────

export async function pullAndMerge(userId: string): Promise<void> {
  if (!firebaseEnabled || !firestore) return
  const q = query(
    collection(firestore, 'users', userId, 'sessions'),
    orderBy('createdAt', 'desc'),
    limit(200)
  )
  const snap = await getDocs(q)
  for (const d of snap.docs) {
    const cloud = d.data() as Session
    const local = await db.sessions.get(cloud.id)
    if (!local || (cloud.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      await saveSession(cloud)
    }
  }
}

// ─── Real-time listener for team rooms ────────────────────────────────────────

export function listenTeamRoom(
  roomId: string,
  onUpdate: (data: any) => void
): Unsubscribe {
  if (!firebaseEnabled || !firestore) return () => {}
  const ref = doc(firestore, 'teamRooms', roomId)
  return onSnapshot(ref, snap => {
    if (snap.exists()) onUpdate(snap.data())
  })
}

export async function updateTeamRoom(roomId: string, patch: object): Promise<void> {
  if (!firebaseEnabled || !firestore) return
  await setDoc(doc(firestore!, 'teamRooms', roomId), patch, { merge: true })
}
