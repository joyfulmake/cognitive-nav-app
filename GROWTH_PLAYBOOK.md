# Cognitive Nav — Zero-Cost Growth Playbook

_A practical, no-budget go-to-market guide. Built for a solo builder — every tactic here costs time, not money. Living document: update as tactics are tried, keep what works, cut what doesn't._

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
