# Submission copy and demo outline

Working draft from the prototype blueprint. Replace the live-validation items only after they are observed in the configured app.

## Short pitch

Paste an error and the nearby code. Tracekit classifies the failure, explains a likely cause, proposes a focused fix, and shows what to check next.

## Project description

Tracekit is a debugging copilot for students working from compiler errors and stack traces. It uses Nemotron Nano through Nebius Token Factory to classify an error and estimate severity, then requires a Tavily search of a short, pattern-redacted error signature before asking Nemotron Super to explain the likely cause and propose a code change. Tavily can return up to three references; pages are treated as untrusted evidence, and the model can cite only IDs that were actually returned. Empty results and search failures are disclosed. A configured Nemotron Ultra can review cases Super flags for deeper reasoning or a student's explicit request; when Super triggers it, its concise evidence-based reason appears in the pipeline.

The workspace streams stage progress, shows returned model timing and token counts when available, and displays ordinary proposed changes line by line. Exceptionally large comparisons use grouped sections to keep the page responsive while retaining all lines. The submitted error and code are designed to go to Nebius Token Factory; Tavily receives only a short, pattern-redacted query derived from the error, not the code. Tracekit does not execute submitted code or claim that a proposed fix passed. Its manual check is self-reported. The account's Nano and Super models were confirmed through model listing, but inference and the full analysis flow have not been run because the Nebius balance is $0.00 and the listed inference is metered.

## Built With (confirm before submission)

- **Nebius Token Factory** for server-side Nemotron inference; verify the account and exact model IDs with a live call.
- **NVIDIA Nemotron Nano and Super** for triage and proposed fixes; include **Ultra** only if it is configured and actually invoked.
- **Tavily Search API** for the redacted error-signature lookup.
- **Next.js and TypeScript** for the application.

Remove any entry that was not actually used in the final running project.

### Claims to fill after live validation

- Account-visible Nano and Super model IDs from the Token Factory model-list API: **`nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`** and **`nvidia/nemotron-3-super-120b-a12b`**; inference authorization is unverified. Ultra is not configured or used.
- Track selection: **Best Apps and Agents** (user-confirmed; recheck that the final app and description still match before submission)
- Prior-work disclosure: **[check whether the project existed before Aug 26, 2026; if so, summarize significant updates since that date using verifiable history]**
- Observed behavior on the five quick-start examples: **[record what happened, including failures]**
- Actual model timing/token metadata: **[quote only values returned by the API; do not estimate costs]**
- Tavily: one basic search on Oct 30, 2026 returned one Stack Overflow result under the free plan; no-results and error behavior remain untested.
- Hosted demo URL and public repository URL: **[add after deployment/publication]**
- Token Factory and Nemotron feedback: use the [tool feedback worksheet](TOOL_FEEDBACK.md) after direct use; do not invent quality or time-saved claims.

## Demo outline (target: 2:40)

| Time | Show |
| --- | --- |
| 0:00–0:20 | Introduce the student debugging problem and the compiler error being used. |
| 0:20–0:45 | Select a quick-start example and show the error, nearby code, and language. |
| 0:45–1:15 | Start Tracekit. Say aloud that Nemotron Nano and Super run through Nebius Token Factory; show the Nano → Tavily → Super path and the Ultra decision only if it actually runs. |
| 1:15–1:55 | Explain the classification, severity, likely cause, fix steps, and line-level proposed-code diff. Point out a returned source's hostname before opening it. |
| 1:55–2:20 | Point out that Tracekit did not execute the snippet. If demonstrating a manual run, label it as your own check outside Tracekit. |
| 2:20–2:40 | Close with who the tool is for and what data goes to Nebius versus Tavily. |

Record actual application output. If a provider stage is unavailable or returns no sources, show and describe that state instead of substituting a mock result. Keep the final video under three minutes.

## Before recording

- Complete the live checks in [the build log](../BUILD_LOG.md) and [deployment runbook](../DEPLOYMENT.md).
- Present Tracekit as a student debugging copilot in the selected Best Apps and Agents track; do not imply that it executes or tests submitted code.
- Use the deployed app and account-enabled model IDs; confirm the live Tavily search and Token Factory calls. Mention Ultra only if it actually runs.
- Say the Nebius Token Factory and NVIDIA Nemotron usage aloud; do not rely on stage labels alone.
- Do not state accuracy, time saved, cost, or successful verification without measurements or evidence.
- Keep the privacy explanation consistent with the interface and README.
- Confirm the public repository, hosted URL, and final video are accessible before submitting.
