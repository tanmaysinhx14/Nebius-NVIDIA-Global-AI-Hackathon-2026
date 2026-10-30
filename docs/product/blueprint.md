# Nebius x NVIDIA Hackathon — Prototype Blueprint

Oct 24, 2026 · @Tanmay Sinha

Deadline is Oct 30, 10:00 AM PT — 10:30 PM IST on Oct 30 — roughly 6 days out, so scope is cut to one track, one model-tiering story, and one demoable flow, buildable solo with Codex on a Next.js/TypeScript + Python stack.

## Track & concept

**Track: Best Apps and Agents** — selected after comparing Tracekit's proposed-fix workflow with the [current official track descriptions](https://nebiusglobalaihackathon.devpost.com/rules). This track welcomes useful applications and copilots powered by Nemotron on Token Factory. Tracekit explains errors and proposes code changes; students run and verify those changes themselves. The Nano → Tavily → Super → optional Ultra workflow remains the product's technical story.

**Concept: an error-triage and fix copilot for student code.** Paste a stack trace or compiler error plus the surrounding code; the agent classifies the error, explains a likely cause, proposes a fix, and guides the student through checking it locally. Automated execution is cut from this prototype.

**Problem, specifically:** engineering students debug alone at 2 AM with no TA around; generic chatbots give verbose, ungrounded answers and don't distinguish a one-line typo from a genuine logic bug, so students either over-trust a wrong fix or waste time on a trivial one. Real audience: you and your SRM CSE batch, extendable to any student using a lab machine or a cheap laptop.

**What makes it non-obvious (map this directly to the Judging Criteria):**

- **Technological Implementation** — credit-aware model tiering: Nemotron Nano classifies error type/severity in under a second, Super writes the explanation and fix, Ultra is only invoked when Super flags the bug as genuinely algorithmic or multi-file. This mirrors the hackathon's own stated Token Factory strategy almost verbatim, which is worth calling out explicitly in your project description.
- **Quality of Idea** — grounding via Tavily: before Super/Ultra answers, a Tavily search pulls 2–3 current docs/Stack Overflow results keyed to the error signature, so the fix cites something real instead of hallucinating syntax from a stale training cutoff. This also qualifies the project for the separate $3,000 "Best Use of Tavily" prize.
- **Design** — the prototype's complete loop is input → triage → current references → proposed fix → student-run manual checks. Tracekit does not execute arbitrary submitted snippets.

## Architecture

**Frontend:** Next.js + TypeScript, single page — code/error input box, a triage card, an explanation + diff view, and a self-reported manual verification checklist. Matches your existing stack, deploy straight to Vercel.

**Backend:** Next.js API routes (or a small FastAPI service if Codex scaffolds it that way) making server-side calls to the Nebius Token Factory inference endpoint — confirm the exact endpoint URL, auth header, and current Nemotron model names from the Nebius docs when you get your API key, since naming/versions move fast and shouldn't be guessed into the repo.

**Model tiering (the core technical story):**

1. **Nemotron Nano** — classify error (syntax / runtime / logic / dependency) and severity. Fast, cheap, runs on every request.
2. **Nemotron Super** — generate the explanation and proposed fix, using the Nano classification + any Tavily context as input.
3. **Nemotron Ultra** — only called when Super's own output flags the bug as deep/algorithmic (e.g. a recursion or complexity issue) or when the user explicitly hits "think harder." Keep this behind a toggle so the demo video can show the tiering decision happening live — that visible moment is what makes "effective use of Nemotron" legible to judges in under 3 minutes.

**Grounding:** one Tavily search per request, query built from the error signature (exception type + key message tokens), top 2–3 results passed as context into the Super/Ultra call. This is the whole RAG layer — no vector DB, no embeddings pipeline, which is the right call for a 6-day build.

**Automated verify step (cut from this prototype):** running the fixed snippet is deferred. A future version would need a separately reviewed isolation boundary, such as a tightly limited Python subprocess or Nebius Serverless Job; do not run arbitrary pasted code in the app.

**Deployment:** Vercel for the app itself (fast, free tier, you already have tooling for it); Nebius AI Cloud is satisfied by the runtime inference calls to Token Factory — you don't need to self-host the model.

## 6-day build plan

| Day | Dates (IST) | Focus | Deliverable |
| --- | --- | --- | --- |
| 1 | Oct 24–25 | Nebius Token Factory + NVIDIA account setup, confirm exact model names/endpoint, repo scaffold (Next.js + TS), OSS license added | One working Nemotron API call end-to-end from your own machine |
| 2 | Oct 26 | Core triage → explain → fix loop; wire Nano + Super; minimal UI | Full request/response flow working on 2–3 hardcoded error cases |
| 3 | Oct 27 | Tavily grounding wired in; Ultra fallback toggle; test against 5–10 real errors from your own assignments/YOLO/DTM projects | Grounded, tiered pipeline working on real inputs |
| 4 | Oct 28 | Provider error handling; deploy to Vercel; fix breakages under real traffic | Live demo URL, stable |
| 5 | Oct 29 | Record ≤3-minute demo video (public YouTube); write project description; finish README with setup instructions; submit feedback section (unlocks the $100 swag pack + Most Valuable Feedback eligibility) | Video uploaded, README complete |
| 6 | Oct 30, before 10:00 AM PT / 10:30 PM IST | Final QA pass; re-check video is under 3 minutes; confirm repo license is visible in the GitHub About section; submit | Submission locked in |

## Submission checklist

- [ ] Working demo URL (hosted app, free, accessible without login friction — or include test credentials if it needs login)
- [ ] Public code repo (GitHub/GitLab/Bitbucket) with an open-source license (Apache 2.0, MIT, or MPL 2.0) visible at the top of the repo page / About section
- [ ] README with setup instructions and clear run guidance
- [ ] Project description: what you built, why, how it works — explicitly name Nemotron Nano/Super/Ultra tiering and where Token Factory accelerated the build
- [ ] Demo video: ≤3 minutes, public on YouTube, shows the app actually running
- [ ] Track selected on the submission form: Best Apps and Agents
- [ ] Feedback on Nebius Token Factory / AI Cloud / NVIDIA tools (required field — also the entry condition for the $100 swag + Most Valuable Feedback prize)
- [ ] If the project existed before the Submission Period began on Aug 26, 2026, include a written explanation of its significant updates made since that start date; confirm the project history before making this claim
- [ ] Tavily usage called out explicitly in the description, if you keep it — it's the only thing that makes you eligible for the separate $3,000 "Best Use of Tavily" prize

## Cut list

If Day 3 or 4 slips, drop in this order:

1. **Verify/run step first.** Hardest to make stable across arbitrary code in limited time; its absence doesn't break the core pitch.
2. **Ultra tier second.** Fold its cases into Super — you lose a sentence in the pitch, not the architecture.
3. **Never cut:** the Nano → Super tiering story, Tavily grounding, a working deploy URL, the README, the license, and the 3-minute video. These six are what Stage One pass/fail and all four Stage Two criteria actually check — everything else is polish.
