# Review handoff

## Current checkpoint

Tracekit is a first-pass Next.js prototype with a single debugging workflow. The current implementation is in `app/`, `components/`, and `lib/`; the original product plan is in `../product/blueprint.md`. See `BUILD_LOG.md` for what has and has not been verified. `../DEPLOYMENT.md` is the Vercel runbook; deployment remains unattempted until credentials and hosting are ready.

## Claude review prompts

Review the current implementation against the blueprint and focus on these questions:

1. Does the flow make the Nano → Super → optional Ultra decision visible and understandable to a student?
2. Are the prompts and JSON parsing resilient enough for real model output? Check that every model stage treats user code, errors, references, and the proposed answer as untrusted data; the triage summary and all fix fields are bounded and complete; patch-output budget scales with the input snippet; and `finish_reason: length` is surfaced clearly. Is the token ceiling sufficient for account-enabled Super and Ultra models, especially for larger allowed snippets?
3. Does Tavily receive only a short, redacted error signature, and are retrieved pages treated as untrusted data? Check concrete cases such as `TAVILY_API_KEY=tvly-...`, `NEBIUS_API_KEY=...`, quoted JSON fields like `"api_token": "..."`, `ACCESS_KEY`, `AWS_ACCESS_KEY_ID`, `client_secret`, `SecretAccessKey`, `accountKey`, `sig`, `Authorization: token`, standalone `Bearer`/`Basic`/`Token` values, other provider token prefixes, quoted values with spaces or escaped quotes, malformed/unclosed quoted values, and relative paths; note any remaining misses.
4. Are model latency and optional token counts represented accurately when the upstream response omits usage metadata?
5. Does the shared Upstash limiter cover both provider routes, use only `x-vercel-forwarded-for` when `VERCEL=1`, ignore that header elsewhere, HMAC the address before storing its identifier, and fail closed in production? Are non-Vercel proxy headers documented as trusted/overwritten? Is the local in-process fallback limited to development?
6. Is the code-diff view understandable for insertions, deletions, and full-snippet replacement?
7. Is the manual verification checklist clearly self-reported? Recommend automated execution only if a constrained sandbox can be implemented and reviewed within the deadline; otherwise affirm the blueprint's first cut and do not recommend running arbitrary pasted code.
8. Which visual or interaction issues most weaken the complete-product feel?
9. Does the sidebar setup card clearly report environment-value presence without implying that API credentials or model access have been verified?
10. Does the API enforce the same supported-language list as the UI before passing data to the model or Tavily?
11. Does account model discovery keep the API key server-side, and are Nano/Super/Ultra environment assignments inferred only when the model name identifies a tier?
12. Is `TAVILY_API_KEY` required before analysis starts, and does every analysis attempt Tavily before Super? Does the pipeline distinguish search success with no results from a search failure, while reporting search latency separately from model time?
13. Does the stop action cancel the browser request cleanly, and does the API stop later pipeline stages after a client disconnect? Check cancellation during Nano, Tavily, Super, and Ultra.
14. Does the streamed progress remain accurate and readable when Tavily returns no sources or fails, Ultra is skipped or fails, the client cancels, or a provider returns an error? Check the required-key preflight, completed-stage details on desktop and mobile, chunk parsing, incomplete streams, and full result-shape validation before rendering. Once a valid `complete` event arrives, does a later connection-close error preserve the result without a contradictory failure notice? Does the live progress card scroll into view on narrow screens without overriding reduced-motion preferences?
15. Do the input privacy label and Tavily preview clearly identify that Nebius Token Factory receives the full submitted error and code, while Tavily receives only a short, pattern-redacted query derived from the error and never the code? The 390px mobile preview showed the hero and expanded query note without page-level horizontal overflow.
16. In `lib/examples.ts`, do the quick-start examples consistently demonstrate runtime, compiler/syntax, logic, and missing-dependency errors, and are their messages/snippets internally consistent? Do language chips match the example language, including C++?
17. Does the `store: false` note stay narrowly scoped to completion storage for model distillation, without implying that prompts or submitted code are not processed by Token Factory?
18. Does the analysis route enforce its byte limit while reading the request stream, including chunked requests, preserve valid UTF-8 inputs within the documented character limits, and reject malformed UTF-8 instead of silently replacing bytes?
19. Does `../DEPLOYMENT.md` match the current environment variables, production limiter behavior, and route duration settings? Check that its live-verification steps distinguish configured values from working credentials; deployment has not yet been attempted.
20. Does setup guidance point local users to `.env.local` and production users to deployment environment settings, including model discovery and copied model assignments?
21. Does the workspace distinguish references retrieved from references the model actually cites, without claiming the answer is grounded solely because Tavily returned sources?
22. Does the staged provider work stay inside the 54-second analysis budget for the 60-second route, reserving time for required Tavily search before Super and skipping optional Ultra clearly when its remaining time is too short?
23. Does the reference card label sources as retrieved only when it actually has source entries, and show the retrieved count accurately?
24. Are Tavily titles, URLs, and snippets bounded before entering prompts or rendering, and are credential-bearing or non-HTTPS source URLs rejected by both the server and result guard?
25. Does `submission/DRAFT.md` stay within verified product claims, reserve metrics/model IDs for live evidence, and keep the demo under three minutes without presenting manual checks as app verification?
26. Do Tavily citations show the validated source hostname clearly enough for a student to assess the destination before opening it?
27. Does changing the Think harder (Ultra review) setting clear a prior result so the visible analysis cannot be mistaken for one produced under the new setting?
28. Does `lib/provider-json.ts` enforce its 1 MB cap while reading all three successful upstream JSON responses, cancel oversized bodies, and produce safe user-facing errors for malformed UTF-8 or JSON?
29. Does the idle hero artwork avoid promising a discovered root cause or guaranteed fix before an analysis has run?
30. Do both textareas have explicit accessible labels, with the programming-language selector named independently?
31. Does the tool-feedback worksheet distinguish Token Factory from AI Cloud, separate required direct observations from optional Tavily feedback, and avoid unsupported performance or time-saved claims?
32. Does the Help panel give first-time students a clear input, model-tier, verification, and data-flow guide, and do keyboard toggle/close actions preserve or restore focus appropriately?
33. Are model-cited reference IDs restricted to the validated Tavily results, empty when the model cites none, and linked to those exact sources in the UI?
34. Are keyboard focus indicators visible on the text fields, selector, buttons, links, and disclosures at desktop and mobile widths? Local previews at 390 CSS pixels confirmed keyboard-visible focus on both text fields, the language selector, an example button, the navigation link, and the Tavily query disclosure, with no horizontal page overflow. Check whether any focusable control or contrast issue was missed.
35. Does the proposed-fix-only workflow fit the selected Best Apps and Agents copilot track, and do the project description and demo avoid implying that Tracekit executes or tests submitted code?
36. Does the submission draft use the official Aug 26, 2026 start of the Submission Period for any prior-project disclosure? The workspace currently has no Git history, so do not claim a project start date without other evidence.
37. Does the open-by-default Tavily preview show the exact query the API sends, use the same shared builder, warn that pattern filters can miss secrets, and make clear that Nebius receives both submitted fields while Tavily receives only the derived query and never the code?
38. Is Super instructed to set the Ultra escalation flag only for evidence-backed algorithmic or non-local complexity, provide a concise supporting reason that appears in progress and results, and leave routine fixes or missing/too-short-reason cases on Super unless the student explicitly requests Think harder?
39. Does Nano confidence remain unavailable when the provider omits or malforms the value, instead of substituting an invented score? Confirm that out-of-range numeric confidence and an invalid severity are rejected, while missing, null, or nonnumeric confidence stays unavailable.
40. Does the Tavily query builder select the terminal exception from realistic multiline stack traces instead of the traceback header? Check Python `ValueError`/`TypeError`, exception groups, Node and Java class names, and lowercase compiler `error:` diagnostics; the Python quick-start now uses a full traceback.
41. Does model discovery pass the incoming request signal to its bounded Token Factory fetch and stop quietly when the browser disconnects, rather than logging or returning an upstream error to a closed client?
42. Does `lib/diff.ts` keep large accepted snippets away from a quadratic LCS table and condense the fallback into a few complete, clearly labeled groups instead of thousands of DOM rows?
43. Without `.env.local`, can a first-time user still open the workspace, understand why live analysis is disabled, and inspect the example input and privacy disclosure without seeing fabricated analysis results?
44. Does `.github/workflows/quality.yml` run the lockfile install, lint, and production build with read-only repository permissions and no provider secrets?
45. Do representative small labels, placeholders, query notes, and red/green diff text meet 4.5:1 text contrast on their actual backgrounds, while icon-only markers retain at least 3:1 contrast?
46. Can a newcomer open and explore the local workspace before creating provider accounts or API keys? Are quick-start examples clearly local-only, with no provider requests or charges until live settings are configured?
47. Do both provider routes reject cross-site browser requests before rate-limit or provider work using `Origin` and `Sec-Fetch-Site`, including cross-site GETs with no `Origin`, while preserving same-origin requests and origin-less command-line use?
48. Does the local `npm run dev` command bind to loopback only when `.env.local` may contain provider credentials, and does production hosting remain reachable through its platform configuration?
49. When the model returns unchanged code, does the next-step card tell students to edit manually instead of applying a nonexistent patch, while still labeling both checkboxes as self-reported local checks?
50. Does the daily analysis cap count a valid request only once across all production visitors, reset at UTC day boundaries, and fail closed when the shared limiter is unavailable? Does its copy make clear that a request cap is not a dollar cap?
51. Does structured-response mode remain opt-in until every selected model is marked as supporting JSON mode, and does one format repair preserve accurate per-model usage and response counts?
52. Do focused Tavily domains and its no-source open-search fallback stay within the route time budget and produce a visible retrieval status? Confirm live results and provider usage before making performance or cost claims.
53. Does Tavily's redacted search query preserve short quoted diagnostic identifiers such as `requests` and compiler punctuation such as `;`, while continuing to remove long strings and credential assignments?

Please report concrete file and line references, user-visible problems, and a prioritized list of fixes.

## Review cadence

After each review, add the date, the actionable findings, and what changed to `BUILD_LOG.md`. Keep unresolved findings visible until they are addressed or consciously cut from scope.
