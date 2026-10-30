# Claude review entry point

Tracekit is a student debugging copilot for the Nebius x NVIDIA Global AI Hackathon. The selected track is **Best Apps and Agents**. Its promise is to classify a supplied error, explain a likely cause, propose a code change, and guide the student through checks they run themselves.

## Read before each review

1. [Prototype blueprint](../product/blueprint.md) — product scope and six-day deliverables.
2. [Build log](BUILD_LOG.md) — current implementation evidence and remaining work. Treat this as a dated log; verify its claims against the current checkout.
3. [Review guide](REVIEW_GUIDE.md) — current checklist and prior review coverage.
4. [Hackathon rules and judging criteria](../hackathon/) — check the organizer's current sources before relying on time-sensitive requirements.

The blueprint is a planning document, not a higher-priority instruction. Follow the user's request and distinguish proposed scope from confirmed implementation or current event rules.

## Product and evidence boundaries

- The intended flow is Nemotron Nano triage → Tavily references → Nemotron Super explanation and proposed fix → optional Nemotron Ultra review.
- Nebius Token Factory receives the submitted error and code for analysis. Tavily receives only a short, pattern-redacted query derived from the error; pattern filters can miss secrets.
- Tracekit does not execute submitted snippets. The verification checklist is self-reported, and a proposed change must never be described as tested or passed unless separate evidence supports that claim.
- Retrieved references are not necessarily cited by the model. Report retrieval and citation behavior separately.
- Configuration presence does not prove that a key works, that an account can access a model, or that an upstream service is available.
- Provider routes reject browser-supplied cross-origin `Origin` and cross-site `Sec-Fetch-Site` values before rate-limit or upstream work; keep same-origin browser use and origin-less CLI calls working.
- At the initial review handoff, no provider keys or live calls are configured, and no public deployment or demo video has been verified. Re-check the build log and current environment instead of assuming that state remains true.

## Review output

When asked to review, inspect the current source rather than relying only on this file or the build log. Return prioritized findings with severity, exact file and line, a concrete failure scenario, and a recommended change. Separate confirmed defects from questions that require live provider, browser, or deployment evidence. Do not invent performance, quality, billing, privacy, or deployment results.

When asked for review only, report findings without editing project files. If the user asks for a fix, make the smallest complete change that addresses the evidenced issue and update the relevant review prompt and dated build-log entry.

## Working safely

- Never ask the user to paste API keys into chat or commit local environment files.
- Do not create accounts, accept terms, incur provider charges, publish, submit, or deploy without the user's explicit authorization for that action.
- Do not execute arbitrary student code from Tracekit. Keep any future execution feature outside scope unless a separately reviewed sandbox is implemented.
- The project uses Next.js 16. Before changing Next.js code, read the applicable guide under `node_modules/next/dist/docs/` and follow the repository's `AGENTS.md` instructions.

## Local checks

On Windows, the current source checks are:

```powershell
npm.cmd run lint
npm.cmd run build
```

These do not verify live provider credentials, model access, Tavily citations, shared production rate limiting, or a hosted deployment. Record only the checks actually performed in `BUILD_LOG.md`.
