import { doc, getDoc, setDoc, increment } from 'firebase/firestore'
import { firestore, firebaseEnabled } from './firebase'

// ─── Premium interest capture — the "1,000 demand signals" trigger from ──────
// PRODUCT_ROADMAP.md Release 5.0. Works fully without Firebase configured
// (records locally only); when Firebase IS configured, also increments a
// single shared counter doc so the count can be shown across all visitors.
//
// Firestore setup required for the shared count (not something this code can
// do for you): add a rule allowing read + increment-only write on the single
// doc `stats/premiumInterest`, e.g.:
//   match /stats/premiumInterest {
//     allow read: if true;
//     allow write: if request.resource.data.count == resource.data.count + 1;
//   }

const LOCAL_FLAG_KEY = 'cogNav-premium-requested'
const COUNTER_PATH = ['stats', 'premiumInterest'] as const

export function hasRequestedPremiumAccess(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(LOCAL_FLAG_KEY) === 'true'
}

export async function requestPremiumAccess(context: { domain?: string; tier?: string }): Promise<void> {
  if (hasRequestedPremiumAccess()) return
  localStorage.setItem(LOCAL_FLAG_KEY, 'true')

  if (!firebaseEnabled || !firestore) return
  try {
    await setDoc(
      doc(firestore, ...COUNTER_PATH),
      { count: increment(1), lastContext: context },
      { merge: true }
    )
  } catch { /* silent — local flag already recorded the interest */ }
}

/** Returns null if Firebase isn't configured or the read fails — callers should
 *  render a non-numeric fallback rather than a broken/zero count. */
export async function getPremiumInterestCount(): Promise<number | null> {
  if (!firebaseEnabled || !firestore) return null
  try {
    const snap = await getDoc(doc(firestore, ...COUNTER_PATH))
    return snap.exists() ? (snap.data().count ?? 0) : 0
  } catch {
    return null
  }
}
