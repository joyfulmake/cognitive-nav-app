# Cognitive Nav — Zero-Cost Growth Playbook

_A practical, no-budget go-to-market guide. Built for a solo builder — every tactic here costs time, not money. Living document: update as tactics are tried, keep what works, cut what doesn't._

---

## 0. One-page brief — pull from here before drafting any post

Read this before adapting any draft in §8. Keeping every platform's copy sourced from the same facts is what makes the four posts read as one coherent launch instead of four different pitches.

**Elevator pitch (one sentence):** An AI that never answers your question — it classifies how deep it is across 4 cognitive layers and tells you exactly what's missing to go deeper.

**Elevator pitch (one paragraph):** Cognitive Nav is a depth-graded epistemic trainer. You ask a question about any topic; the AI never answers it — it classifies which of four cognitive depths the question reached (name it → explain the mechanism → name where it breaks → question why the system was designed that way) and returns a precise redirect naming the exact structural gap. Five qualifying questions at a depth locks that thinking pattern in, based on Hebb's 1949 work on repeated neural co-activation. Free, no login, works offline.

**Key facts (use these numbers, don't round up):**
- 4 cognitive depth layers (Factual → Relational → Systemic → Wisdom), 3 gates between them
- 5 qualifying questions per gate to lock it in (Hebbian learning, Hebb 1949; white-matter density findings, Bengtsson)
- 15 domains live: General Epistemic (any topic) plus 14 domain-specific Crucibles — Medicine, Engineering, Law, Computer Science, Physical Sciences, Life Sciences, Mathematics, Business/Econ/Finance, Humanities, Social Sciences, Arts & Design, Trades & Vocational, Education, Agriculture & Environmental Science, Entrepreneurship
- Each domain spans a full T1–T5 tier ladder — school level through doctoral/frontier
- ~56 real, recognized credentialing exams woven in where they exist (NEET/USMLE/PLAB, CFA/CPA/actuarial ASA-FSA, Bar Exam/SQE/AIBE, PE/FE/GATE, CISSP/CEH/OSCP/CISM, and more) — never invented ones (Entrepreneurship intentionally has none, on principle)
- Free, no login required, works fully offline after first load (IndexedDB/Dexie), 18-language narration
- Built on Groq (`llama-3.3-70b-versatile`) — evaluation only, never generates answers to the user's question

**Links:**
- Live: https://cognitive-nav.pages.dev
- Repo: `git@github.com:joyfulmake/cognitive-nav-app.git`
- Demo video: embedded on the homepage (also at `public/demo.mp4` / `demo.webm` in the repo)

**Boilerplate "about" paragraph** (for a press-kit-style signature block, PH "about the maker," etc.):
> Cognitive Nav is a free, depth-graded epistemic trainer that scores the quality of your questions instead of answering them — built on Hebbian learning research and calibrated to real credentialing exams across 15 fields, from NEET and USMLE to the CFA and the bar exam.

**Answers ready before anyone asks (HN/Reddit will ask these — have the calm version ready, don't improvise under pressure):**
- *"Isn't this just a ChatGPT wrapper?"* — The value isn't the LLM call, it's the rubric: a fixed 4-layer depth taxonomy, hard gate criteria per layer (with an "iron rule" that never rounds a borderline case up), and domain/tier calibration data hand-built for 15 fields. The LLM is the classifier; the product is the rubric and the redirect logic around it.
- *"How is this different from a tutor / Khan Academy / etc.?"* — Deliberately the opposite of a tutor: it never explains or answers. See `PRODUCT_ROADMAP.md`'s "Things deliberately NOT on the roadmap" — answer-checking and AI tutoring are explicitly out of scope, on purpose.
- *"Is my data private / where does this run?"* — Sessions are stored locally-first (IndexedDB via Dexie); nothing requires an account. Optional cloud sync exists only if a user signs in.
- *"What's the catch / business model?"* — Currently fully free, still in the traction-building phase (see `PRODUCT_ROADMAP.md` Release 5.0). Answer honestly if asked — say a premium tier is planned for advanced content later, free tier stays free.

---

## 1. Positioning — say this, not that

The product's own tagline is already strong: **"The question is the answer."** Don't dilute it. Every channel below should lead with a version of it, tuned to the audience:

| Audience | Lead line |
|---|---|
| NEET/USMLE/exam-prep students | "Stop memorizing answers. Train the questions that get you to L4 reasoning — the level boards actually test." |
| Curious generalists (General Epistemic) | "An AI that never answers your question — it tells you exactly what your question is missing." |
| Developers / HN / tech Twitter | "A depth-graded Socratic engine: 4 cognitive layers, LLM-scored, gate-locked at 5 reps per Hebbian learning (Hebb 1949)." |
| Educators | "A free tool that shows you exactly which cognitive layer each student's question reached — no grading, no rubric-writing." |

Never say "AI tutor" — the product explicitly isn't one (see `PRODUCT_ROADMAP.md`'s "not on the roadmap" list: no answers, no explanations). Say "depth trainer" or "question gym."

**One non-negotiable asset**: the recorded demo video (`public/demo.mp4`/`demo.webm`, already on the Home page) is the single best conversion tool you have — every channel below should link straight to it or embed it, not just the homepage.

---

## 2. Beachhead: pick ONE audience first

Don't launch to all 15 domains' audiences simultaneously — you'll spread thin and each community will see a generic pitch instead of a targeted one. Sequence:

1. **NEET/USMLE/PLAB prep communities first.** Clinical Crucible is the most mature vertical (real exam boards, case-based sessions, body-system tracking). These communities are huge, extremely online, and chronically searching for "better ways to study" — the exact pitch this product makes.
2. **Then CFA/Bar Exam/GATE communities** (Business/Finance, Law, Engineering domains) — same playbook, different subreddit/Discord.
3. **Then General Epistemic / HN / Product Hunt** for the tech-curious, broader audience — this is where "cool AI product" traction compounds fastest but converts to *usage* less predictably than exam-prep desperation does.

Exam-prep audiences convert better than general-curiosity audiences because they have an urgent, specific pain (a test date) — lead with them.

---

## 3. Zero-cost online channels, ranked

### Tier 1 — do these first (highest signal-to-effort for this product)

**Reddit** (free, no algorithm gatekeeping if done right)
- Target subs: r/NEET, r/medicalschool, r/step1, r/step2, r/USMLE, r/IMGreddit, r/PLAB, r/CFA, r/LawSchool, r/gatecracker, r/GetStudying, r/artificial, r/SideProject
- **Rule that matters more than the tool**: read each sub's self-promo rules first (most require a 10:1 or 9:1 ratio of helpful comments to self-promo posts, or a specific self-promo day/thread). Getting banned burns the account and the domain's reputation.
- Best format: NOT "check out my app" — instead, answer an existing "how do I actually retain X for boards" thread genuinely, and mention the tool as one part of the answer, with a plain link. Authenticity reads immediately in these communities.
- A dedicated post works once you have some traction to point to (e.g. "I built a free tool that scores the depth of your question instead of giving you the answer — here's why" with the demo video linked).

**Telegram / WhatsApp study groups**
- NEET/USMLE/CFA prep in India and internationally runs heavily on Telegram channels and WhatsApp broadcast groups, often with 1,000–50,000 members, run by coaching institutes or senior students.
- Zero cost: join a handful as a genuine participant, contribute for a while, then share when it's relevant (not as a first message). Ask group admins directly — many are happy to share a genuinely free, no-login tool with their members; this is the single highest-leverage free channel for this specific audience and nobody else is doing outreach here for you.

**Product Hunt** (free launch)
- One-time push, best done once the video demo + at least one live domain flow is polished (already true). Coordinate the launch day: post early (12:01 AM PT), ask a few real users to comment (not upvote-trade, which PH penalizes), respond to every comment same-day.
- Tagline candidate: "Cognitive Nav — an AI that never answers your question, it scores how deep it goes."

**Hacker News ("Show HN")**
- Technical audience responds to the *mechanism*, not the pitch: lead with "Show HN: An LLM that classifies the cognitive depth of your question instead of answering it (Groq, free, no login)". HN rewards technical transparency — mention the Hebbian-learning basis, the gate system, and that it's fully client-side/offline-first (Dexie).
- One shot matters more than volume here — timing (weekday morning US Eastern) and a good first comment from you explaining the "why" get it further than the title alone.

**Twitter / X — build in public**
- Thread the *process*, not just the product: "I built a Socratic AI that only tells you what's missing from your question, never the answer. Here's the neuroscience behind why." Tag nobody, hashtag nothing — organic dev/edtech Twitter favors substance threads.
- Repost the demo video natively (native video uploads outperform links 3-5x on X).

### Tier 2 — steady compounding, lower immediate spike

**SEO content (Dev.to / Hashnode / Medium / your own blog)**
- Target long-tail, low-competition queries this product genuinely answers well: "active recall alternative for USMLE," "how to ask better questions while studying," "Hebbian learning study technique," "NEET PG mnemonic alternative," "Socratic method AI tool free."
- One well-written post per target query, cross-posted to Dev.to/Hashnode (both index fast and rank on their own domain authority even before your own site ranks).
- Each post ends with a link to the live app + demo video, not a sales pitch — over-selling kills SEO content's credibility and its shareability.

**Quora**
- Answer existing questions like "How do I study more effectively for USMLE Step 2" with a genuinely useful, non-salesy answer that references the underlying cognitive-depth idea, with the tool mentioned as one resource. Quora answers rank in Google for years — this compounds slowly but for free.

**YouTube Shorts / Instagram Reels**
- Repurpose the already-recorded demo video into 15-30s clips (one gate-mastery moment, one "prick" redirect moment) — the confetti/ring-burst celebration moment is a strong hook clip. Zero new production cost.

**GitHub discoverability**
- The repo is already public (`joyfulmake/cognitive-nav-app`). Add topics (`education`, `edtech`, `llm`, `socratic-method`, `react`, `groq`) so it surfaces in GitHub topic search. Submit to relevant "awesome-" lists (`awesome-education`, `awesome-llm-apps`) via PR — these get real organic traffic from developers browsing curated lists.

**LinkedIn**
- One well-written post from a personal profile targeting educators/EdTech, framed around the pedagogy ("what if grading measured the question, not the answer") rather than the product. LinkedIn's algorithm rewards native long-form text posts over links — put the link in the first comment, not the post body.

### Tier 3 — opportunistic, do when the moment fits

- **AlternativeTo / Slant.co / "there's an app for that" style directories** — free listings, low but permanent traffic.
- **StudentDoctorNetwork / White Coat Investor forums** (medicine/finance-adjacent communities) — same "answer genuinely, mention naturally" rule as Reddit.
- **College Discord servers** — most large universities have unofficial student Discords; same approach as Telegram groups above.

---

## 4. Offline, zero/low-cost

1. **Coaching institute partnerships (highest leverage, still free)** — NEET/USMLE/CFA coaching institutes (Aakash, Allen, Kaplan-adjacent local centers, university pre-med/pre-law societies) often welcome a free tool their students can use; a direct email or in-person pitch to a faculty coordinator costs nothing but time and can reach hundreds of students at once via their existing communication channels.
2. **Campus ambassador / "founding user" program** — recruit 3-5 engaged students per target exam community to give feedback and share with their study groups in exchange for early access to new features and public credit (a "help build this" pitch works better with students than a discount would, since there's nothing to discount).
3. **University tech fest / hackathon demo booths** — if any local college is running a tech or career fair, a laptop with the demo running costs nothing beyond showing up.
4. **QR-code flyers at library study rooms / coaching center noticeboards** — printing cost only (or free if a coaching institute lets you post digitally on their own channels instead).
5. **Word of mouth via the product itself** — the Team/Nyaya Darshana mode (`PRODUCT_ROADMAP.md` Release 2.2) is a built-in viral loop once shipped: studying together requires inviting a study partner. Even pre-launch, explicitly ask early users to bring one study-group friend — direct, unpaid referral is still the highest-trust channel that exists.

---

## 5. First 30 days — a concrete sequence

| Days | Action |
|---|---|
| 1-3 | Add GitHub topics, write one SEO post (pick the single highest-intent query), set up free analytics (Cloudflare Web Analytics — already available since the app is on Cloudflare Pages, zero setup cost, privacy-respecting, no cookie banner needed) |
| 4-7 | Join 3-5 relevant Telegram/Discord/WhatsApp study groups as a genuine participant — no promotion yet |
| 8-10 | Post 2-3 genuinely helpful Reddit answers (not posts) in target subs, tool mentioned only where relevant |
| 11-14 | Publish the Dev.to/Hashnode cross-post of the SEO article; share natively on X and LinkedIn |
| 15-18 | First direct outreach to 2-3 coaching institutes or student societies via email |
| 19-21 | Now that there's some traction to point to, do the dedicated Reddit post + Product Hunt launch in the same week (cross-reference each other) |
| 22-25 | Show HN post — reference the PH launch and any Reddit traction as social proof in the first comment |
| 26-30 | Review free analytics: which channel actually drove sessions, not just clicks. Cut what didn't work, double down on what did. Update this file. |

---

## 6. Measurement — free tools only

- **Cloudflare Web Analytics** — free, already compatible since deployed on Cloudflare Pages, no code change beyond enabling it in the dashboard. No cookies, no consent banner needed.
- **UTM parameters** on every outbound link (`?utm_source=reddit&utm_campaign=neet-launch`) — free, and Cloudflare Web Analytics (or even just manually reading the query strings in logs) can attribute traffic per channel without any paid tool.
- **Session count via existing Dexie/Firestore data** — `totalSessions` already exists on `UserProfile` (types.ts); a simple internal dashboard (or even a manual weekly count) tells you real usage, not just visits.

---

## 7. Guardrails

- Every community-based tactic above depends on **being a real participant first, promoter second** — the moment a community reads a post as pure self-promotion, the account and often the domain get flagged, closing that channel permanently.
- Don't run the same tactic across all 15 domains at once — sequence per §2. A generic "we support 15 domains" pitch reads as unfocused; a sharp "this is built for NEET Step 2" pitch reads as built-for-you.
- Free channels compound over weeks, not days — the SEO posts and Quora answers won't show meaningful traffic for 4-8 weeks. Don't judge the whole playbook by week-1 numbers; judge Reddit/Telegram/PH by week 1, judge SEO/Quora by week 6+.

---

## 8. The 4-platform launch checklist (Reddit, Product Hunt, Hacker News, Twitter/X)

These are the four Tier-1 channels from §3, expanded into exact, sequenced steps with ready-to-adapt draft copy. Do them in this order, spaced across the same week (per the §5 calendar, days 19-25) — each one references the last as social proof, so the order compounds instead of just repeating.

**Order: Reddit → Product Hunt → Hacker News → Twitter/X thread tying all three together.**

### 8.1 Reddit (do this first — it's where the actual target users already are)

**Prep (do this 1-2 weeks before posting, not the same day):**
1. Pick 2-3 target subs to start (don't hit all of them at once) — e.g. r/NEET + r/medicalschool for the first wave.
2. Join and genuinely comment on 5-10 existing threads in each sub over that week — answer real questions, no link yet. This builds account karma/age past most subs' self-promo minimums and, more importantly, makes your eventual post read as "one of us," not a drive-by.
3. Read each sub's sidebar/wiki rules for self-promotion — note any required ratio, flair, or a specific self-promo day/megathread.
4. Have the demo video ready to link (already recorded, on the Home page) and a 2-3 sentence "why I built this" story drafted.

**Draft post (adapt per sub):**
> **Title:** I built a free tool that never answers your question — it scores how deep it is and tells you exactly what's missing (built for NEET/USMLE prep)
>
> **Body:** I kept noticing I could recite an answer for boards without actually understanding the mechanism underneath it — and that gap only showed up under exam pressure. So I built a tool that does the opposite of every AI study tool: you ask it a question, and it never answers. It tells you which of 4 cognitive depths your question reached (fact → mechanism → edge case → design philosophy) and points at exactly what you're missing to go deeper. Five questions that clear a depth and it's supposed to wire in for good (it's based on Hebb's 1949 work on repeated co-activation). No login, works offline, free. Would genuinely value feedback from people actually in the middle of boards prep: [link]

**Launch day:**
- Post at a high-traffic time for that sub's likely timezone (evening IST for India-heavy NEET subs; US morning/early afternoon for USMLE-heavy ones).
- Immediately add a comment yourself with more of the "why" — gives the post substance before the first stranger comment lands.
- Reply to every single comment within a few hours — velocity matters more than any single reply's cleverness.
- Wait 24-48h before cross-posting to a second sub — simultaneous cross-posting reads as spam to Reddit's spam filter and to readers who browse multiple subs.

### 8.2 Product Hunt (do this once Reddit has produced a few real users/quotes)

**Prep (start ~1 week ahead):**
1. Create/warm up your maker profile — follow a few relevant categories/makers now, don't do it same-day.
2. Prepare: a tagline under 60 characters, 3-5 gallery images or a gif (the confetti/gate-mastery moment is a strong one), and a full "maker comment" (see below) ready to paste the second it's live.
3. Line up 5-10 real people (Reddit responders, early testers) who'll authentically check it out and comment on launch day. Do not organize upvote trading — PH actively detects and penalizes it.
4. Schedule for a Tuesday, Wednesday, or Thursday (highest PH traffic; avoid Monday/Friday/weekend).

**Draft tagline:** "An AI that never answers your question — it scores how deep it is"

**Draft maker comment (post this yourself, immediately, as the first comment):**
> Hey PH! I built Cognitive Nav after noticing that being able to recite an answer and actually understanding it are two different skills — and standardized tests (NEET, USMLE, CFA, Bar exam, and 11 other fields now) only reward the second one under pressure. So instead of another AI that answers your questions, this one classifies the cognitive depth of the *question itself* — 4 layers, from "name it" to "question why the system was designed this way" — and tells you exactly what's missing to go deeper. 5 qualifying questions at a depth and it's meant to wire in permanently (Hebb, 1949). Free, no login, works offline. Would love your feedback, especially if you're currently studying for something with a real stakes exam behind it.

**Launch day:**
- Publish at 12:01 AM PT (PH's day resets then — maximizes the full 24h visibility window).
- Post the maker comment immediately, don't wait for questions to arrive first.
- Share the live PH link on Twitter/LinkedIn/relevant Discords/Telegram groups *after* it's live (early external sharing before the listing exists doesn't help and confuses momentum tracking).
- Respond to every comment same-day. Ask people to "check it out and share feedback," never "please upvote" — against PH's guidelines and it reads poorly regardless.

### 8.3 Hacker News — Show HN (do this after Product Hunt, referencing it as proof)

**Prep:**
1. Draft the title as a plain technical description, not a pitch: **"Show HN: An LLM that scores the depth of your question instead of answering it"**
2. Prepare a technical first comment (post it yourself immediately) — HN's audience wants the mechanism, not the marketing:

> This started from a personal annoyance: I could give a textbook-correct answer on a topic without having actually built the mental model underneath it. So the eval loop here does the opposite of typical AI tutoring — it never answers, it classifies which of 4 cognitive depths your question reached (Groq's llama-3.3-70b-versatile, JSON-mode, ~1 call per question) and returns a targeted redirect naming what's structurally missing. 5 qualifying questions at a depth locks it in, based on Hebb's 1949 repeated-co-activation work. Sessions are stored offline-first in IndexedDB (Dexie) so it works with no account and no network after first load. It now spans 15 fields (medicine, law, engineering, CS, etc.), each calibrated to real credentialing exams where one exists (USMLE, CFA, PE, bar exam, GATE...). No login, free, would love technical feedback — happy to go deep on the eval-prompt design or the gate-mastery logic in the comments.

**Timing:** weekday, 8-10am US Eastern — this is when HN's concurrent readership peaks and the "new" queue still moves fast enough for a good post to surface.

**Launch day:**
- Post, then immediately add the comment above yourself.
- Monitor actively for the first few hours — HN's front-page survival depends heavily on early reply velocity, not just the post itself.
- If technical critique is harsh, engage with the substance rather than defending — HN respects genuine engagement with criticism far more than pushback, and a good back-and-forth thread often outperforms the original post for reach.
- One shot per URL — don't resubmit if it doesn't catch on; wait for a genuinely new milestone (a real feature ship, a traction number) before trying again.

### 8.4 Twitter/X thread (do this last, tying the other three together)

**Prep:**
- Re-cut the demo video to under ~2:20 for native upload (X's sweet spot for native video engagement).
- Draft a 5-8 tweet thread: (1) the problem — reciting ≠ understanding, (2) the insight — Hebbian learning, gate mastery, (3) the mechanism — never answers, scores depth, shows the "prick" redirect, (4) the native video, (5) what's live now (15 fields, real exam boards), (6) links to the Reddit thread / PH listing / HN thread as they go live, framed as "day 1 of this" rather than separate announcements.

**Launch day:**
- Post once Reddit/PH/HN links exist so the thread can reference real, live discussion rather than just claims.
- Post at a high-engagement time for your primary audience's timezone.
- No hashtags, no mass-tagging — organic dev/edtech Twitter rewards substance over reach-gaming.
- Reply to every response; quote-tweet good replies to extend the thread's life instead of starting new posts.

### After all four

Update §6's tracking (UTM per channel) to see which of the four actually converted to real sessions, not just clicks or upvotes — and update this file with what worked before repeating any of it on the second wave of subs/communities.
