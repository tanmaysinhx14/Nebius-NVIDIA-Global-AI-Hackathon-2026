# Submission copy and demo outline

Working draft from the prototype blueprint. Replace the live-validation items only after they are observed in the configured app.

## Short pitch

Paste an error and the nearby code. Tracekit classifies the failure, explains a likely cause, proposes a focused fix, and shows what to check next.

## Project description

Tracekit is a debugging copilot for students working from compiler errors and stack traces. It uses Nemotron Nano through Nebius Token Factory to classify an error and estimate severity, then requires a Tavily search of a short, pattern-redacted error signature before asking Nemotron Super to explain the likely cause and propose a code change. Tavily can return up to three references; pages are treated as untrusted evidence, and the model can cite only IDs that were actually returned. Empty results and search failures are disclosed. A configured Nemotron Ultra can review cases Super flags for deeper reasoning or a student's explicit request; when Super triggers it, its concise evidence-based reason appears in the pipeline.

The workspace streams stage progress, shows returned model timing and token counts when available, and displays ordinary proposed changes line by line. Exceptionally large comparisons use grouped sections to keep the page responsive while retaining all lines. The submitted error and code are designed to go to Nebius Token Factory; Tavily receives only a short, pattern-redacted query derived from the error, not the code. Tracekit does not execute submitted code or claim that a proposed fix passed. Its manual check is self-reported. The account's Nano and Super models were confirmed through model listing, but inference and the full analysis flow have not been run because the Nebius balance is $0.00 and the listed inference is metered.

## Built With (confirm before submission)

- **Nebius Token Factory** for account-visible model discovery and the server-side inference integration; inference was not run.
- **NVIDIA Nemotron Nano and Super** are the configured design roles for triage and explanation; neither model was invoked.
- **Tavily Search API** for the redacted error-signature lookup; one standalone basic search was verified, but the full app route was not run.
- **Next.js and TypeScript** for the application.

Remove any entry that was not actually used in the final running project.

### Claims to fill after live validation

- Account-visible Nano and Super model IDs from the Token Factory model-list API: **`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`** and **`nvidia/nemotron-3-super-120b-a12b`**; inference authorization is unverified. Ultra is not configured or used.
- Track selection: **Best Apps and Agents** (user-confirmed; recheck that the final app and description still match before submission)
- Prior-work disclosure: **New**. Tracekit work is documented in the local project history from October 24, 2026, after the August 26 cutoff.
- Observed behavior on the five quick-start examples: **[record what happened, including failures]**
- Actual model timing/token metadata: **[quote only values returned by the API; do not estimate costs]**
- Tavily: one basic search on Oct 30, 2026 returned one Stack Overflow result under the free plan; no-results and error behavior remain untested.
- Hosted demo URL and public repository URL: **[add after deployment/publication]**
- Demo video: created locally at `assets/Tracekit-Demo-Walkthrough.mp4` (63 seconds, silent with on-screen English captions; no live output simulated), uploaded to YouTube as **Unlisted**, and attached to the Devpost draft: [Tracekit Demo Walkthrough](https://youtu.be/haXhk-AOWxo).
- Token Factory and Nemotron feedback: use the [tool feedback worksheet](TOOL_FEEDBACK.md) after direct use; do not invent quality or time-saved claims.

## Demo video contents (63 seconds)

- **0:00–0:06:** Introduce Tracekit as a student debugging-copilot prototype.
- **0:06–0:18:** Show the real local interface, built-in Python example, and redacted-query preview; no analysis request is sent.
- **0:18–0:28:** Explain the implemented Nano/Tavily/Super path; state that live output is not shown.
- **0:28–0:38:** Show the Nebius versus Tavily data boundary.
- **0:38–0:47:** Explain student review and manual verification.
- **0:47–0:57:** State what was verified and disclose that metered Nebius inference was not run.
- **0:57–1:03:** Close with the prototype's next validation step.

The video is a silent, captioned walkthrough. It uses the real local interface and contains no generated or simulated model answer. It is not a live analysis demo.

## Before submission

- Add the public repository URL when available; no hosted demo URL exists yet.
- Keep the YouTube video Unlisted or Public, password-free, and attached to the Devpost draft: [https://youtu.be/haXhk-AOWxo](https://youtu.be/haXhk-AOWxo).
- Present Tracekit as a student debugging copilot in the selected Best Apps and Agents track; do not imply that it executes or tests submitted code.
- Do not imply that the local walkthrough contains a live Token Factory or Nemotron result.
- Do not state accuracy, time saved, inference cost, or successful fix verification without measurements or evidence.
- Keep the privacy explanation consistent with the interface and README.
- Confirm the public repository, hosted URL, and video link are accessible before final submission.
