"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { diffLines } from "@/lib/diff";
import { ERROR_EXAMPLES } from "@/lib/examples";
import { configurationInstruction, configurationLocation, configurationRefreshAction } from "@/lib/configuration-guidance";
import { buildSearchQuery } from "@/lib/search-query";
import { isAnalysisResult, SUPPORTED_LANGUAGES } from "@/lib/types";
import type { AnalysisResult, AnalysisStage, AnalysisStreamEvent, AvailableModel, ProgrammingLanguage, ServiceConfiguration } from "@/lib/types";

const categoryLabels: Record<string, string> = {
  syntax: "Syntax",
  runtime: "Runtime",
  logic: "Logic",
  dependency: "Dependency",
  unknown: "Needs a closer look",
};

const progressStages: Array<{ id: AnalysisStage; label: string }> = [
  { id: "nano", label: "TRIAGE" },
  { id: "tavily", label: "GROUND" },
  { id: "super", label: "FIX" },
  { id: "ultra", label: "REVIEW" },
];

const languageDotClasses: Record<ProgrammingLanguage, string> = {
  Python: "python-dot",
  JavaScript: "js-dot",
  TypeScript: "js-dot",
  Java: "java-dot",
  "C++": "cpp-dot",
  C: "cpp-dot",
  Other: "other-dot",
};

type ProgressStatus = "waiting" | "active" | "complete" | "skipped" | "error";
type ProgressState = Record<AnalysisStage, { status: ProgressStatus; detail: string }>;

function initialProgress(): ProgressState {
  return {
    nano: { status: "waiting", detail: "" },
    tavily: { status: "waiting", detail: "" },
    super: { status: "waiting", detail: "" },
    ultra: { status: "waiting", detail: "" },
  };
}

function isAnalysisStreamEvent(value: unknown): value is AnalysisStreamEvent {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (event.type === "error") return typeof event.error === "string";
  if (event.type === "progress") {
    return progressStages.some(({ id }) => id === event.stage)
      && ["active", "complete", "skipped", "error"].includes(String(event.status))
      && typeof event.detail === "string";
  }
  if (event.type === "complete") {
    return isAnalysisResult(event.result);
  }
  return false;
}

export default function Workspace({ configuration }: { configuration: ServiceConfiguration }) {
  const [language, setLanguage] = useState<ProgrammingLanguage>("Python");
  const [error, setError] = useState(ERROR_EXAMPLES[0].error);
  const [code, setCode] = useState(ERROR_EXAMPLES[0].code);
  const [thinkHarder, setThinkHarder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<ProgressState>(initialProgress);
  const [verificationChecks, setVerificationChecks] = useState({ failingCase: false, edgeCase: false });
  const [availableModels, setAvailableModels] = useState<AvailableModel[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsMessage, setModelsMessage] = useState("");
  const [copiedModelId, setCopiedModelId] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpToggleRef = useRef<HTMLButtonElement | null>(null);
  const loadingCardRef = useRef<HTMLDivElement | null>(null);
  const activeAnalysisRef = useRef<AbortController | null>(null);
  const diff = useMemo(() => result ? diffLines(code, result.fixedCode) : [], [code, result]);
  const isCondensedDiff = diff.some((line) => line.condensed);
  const tavilyQueryPreview = useMemo(() => buildSearchQuery(language, error), [error, language]);
  const hasSuggestedChange = Boolean(result && result.fixedCode.trim() !== code.trim());
  const tokenFactoryConfigured = configuration.tokenFactoryKeyPresent && configuration.modelsConfigured;
  const rateLimitReady = configuration.rateLimitStatus === "shared" || (configuration.environment === "development" && configuration.rateLimitStatus === "local");
  const analysisConfigurationReady = tokenFactoryConfigured && configuration.tavilyConfigured && rateLimitReady;
  const missingAnalysisSettings = [
    !configuration.tokenFactoryKeyPresent ? "NEBIUS_API_KEY" : "",
    !configuration.modelsConfigured ? "NEMOTRON_NANO_MODEL and NEMOTRON_SUPER_MODEL" : "",
    !configuration.tavilyConfigured ? "TAVILY_API_KEY" : "",
    !rateLimitReady ? "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN" : "",
  ].filter((setting): setting is string => Boolean(setting));
  const analysisSetupHint = missingAnalysisSettings.length
    ? configurationInstruction(configuration.environment, missingAnalysisSettings)
    : "";
  const activeProgress = progressStages.map(({ id }) => analysisProgress[id]).find((stage) => stage.status === "active");
  const groundingDetail = result?.pipeline.find((stage) => stage.name === "Tavily references")?.detail || "";
  const sourceEmptyMessage = groundingDetail.startsWith("No sources returned")
    ? "Tavily returned no references for this error. The code snippet was not sent to Tavily."
    : groundingDetail.startsWith("Search unavailable")
      ? "Tavily search was unavailable for this request. The code snippet was not sent to Tavily."
      : "No external references were returned. The code snippet was not sent to Tavily.";
  const modelResponseCount = result
    ? (result.modelUsage.triage.attempts ?? 1) + (result.modelUsage.fix.attempts ?? 1) + (result.modelUsage.deepReasoning?.attempts ?? 0)
    : 0;
  const totalReasoningTokens = result
    ? [result.modelUsage.triage.reasoningTokens, result.modelUsage.fix.reasoningTokens, result.modelUsage.deepReasoning?.reasoningTokens]
      .filter((count): count is number => count !== undefined)
      .reduce((total, count) => total + count, 0)
    : 0;

  useEffect(() => {
    if (!loading) return;
    loadingCardRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
    });
  }, [loading]);

  function clearAnalysis() {
    setResult(null);
    setAnalysisProgress(initialProgress());
    setVerificationChecks({ failingCase: false, edgeCase: false });
    setMessage("");
  }

  function closeHelp() {
    setHelpOpen(false);
    helpToggleRef.current?.focus();
  }

  function applyExample(index: number) {
    const example = ERROR_EXAMPLES[index];
    setLanguage(example.language);
    setError(example.error);
    setCode(example.code);
    clearAnalysis();
  }

  async function findAvailableModels() {
    setModelsLoading(true);
    setAvailableModels(null);
    setModelsMessage("");
    try {
      const response = await fetch("/api/models", { cache: "no-store" });
      const data = await response.json() as { models?: AvailableModel[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not retrieve the available model IDs.");
      const models = Array.isArray(data.models) ? data.models : [];
      setAvailableModels(models);
      if (models.length === 0) setModelsMessage("No Nemotron model IDs were returned for this API key. Check model access in Token Factory.");
    } catch (caught) {
      setModelsMessage(caught instanceof Error ? caught.message : "Model discovery failed. Try again in a moment.");
    } finally {
      setModelsLoading(false);
    }
  }

  async function copyModelId(model: AvailableModel) {
    try {
      const copyText = model.environmentKey ? `${model.environmentKey}=${model.id}` : model.id;
      await navigator.clipboard.writeText(copyText);
      setCopiedModelId(model.id);
      setModelsMessage(model.environmentKey
        ? `Copied ${model.environmentKey} assignment. ${configurationInstruction(configuration.environment, [model.environmentKey])}`
        : `Model ID copied. Its tier was not inferred, so paste it into the appropriate model variable in ${configurationLocation(configuration.environment)}, then ${configurationRefreshAction(configuration.environment)}.`);
      window.setTimeout(() => setCopiedModelId((current) => current === model.id ? "" : current), 1800);
    } catch {
      setModelsMessage("Clipboard access was blocked. Select and copy the model ID text instead.");
    }
  }

  async function analyze() {
    if (!error.trim() || !code.trim()) {
      setMessage("Add both the error message and the code around it to get started.");
      return;
    }
    const controller = new AbortController();
    activeAnalysisRef.current = controller;
    setLoading(true);
    clearAnalysis();
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, error, code, thinkHarder }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || "The analysis could not be completed.");
      }
      if (response.headers.get("content-type")?.includes("application/x-ndjson") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";
        let receivedResult = false;
        const handleLine = (line: string) => {
          if (!line.trim()) return;
          let event: unknown;
          try {
            event = JSON.parse(line);
          } catch {
            throw new Error("Analysis sent an unreadable progress update. Try again.");
          }
          if (!isAnalysisStreamEvent(event)) throw new Error("Analysis sent an unexpected progress update. Try again.");
          if (event.type === "progress") {
            setAnalysisProgress((current) => ({ ...current, [event.stage]: { status: event.status, detail: event.detail } }));
          } else if (event.type === "complete") {
            receivedResult = true;
            setResult(event.result);
          } else {
            throw new Error(event.error);
          }
        };
        try {
          while (true) {
            const { value, done } = await reader.read();
            buffered += decoder.decode(value, { stream: !done });
            const lines = buffered.split("\n");
            buffered = lines.pop() || "";
            for (const line of lines) handleLine(line);
            if (done) break;
          }
          if (buffered.trim()) handleLine(buffered);
        } catch (streamError) {
          await reader.cancel().catch(() => undefined);
          if (!receivedResult) throw streamError;
        } finally {
          reader.releaseLock();
        }
        if (!receivedResult) throw new Error("Analysis ended before a result arrived. Try again.");
      } else {
        const data: unknown = await response.json();
        if (typeof data === "object" && data !== null && !Array.isArray(data) && "error" in data && typeof data.error === "string") {
          throw new Error(data.error);
        }
        if (!isAnalysisResult(data)) throw new Error("Analysis returned an incomplete result. Try again.");
        setResult(data);
      }
    } catch (caught) {
      if (controller.signal.aborted) {
        setMessage("Analysis stopped. You can change the snippet and try again.");
      } else {
        setMessage(caught instanceof Error ? caught.message : "Something went wrong. Try again in a moment.");
      }
    } finally {
      if (activeAnalysisRef.current === controller) activeAnalysisRef.current = null;
      setLoading(false);
    }
  }

  function stopAnalysis() {
    activeAnalysisRef.current?.abort();
  }

  async function copyFix() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.fixedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage("Clipboard access was blocked by your browser.");
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Tracekit home">
          <span className="brand-mark"><span /></span>
          <span className="brand-name">tracekit<span className="brand-dot">.</span></span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <a className="nav-item nav-item-active" href="#debugger"><span className="nav-icon">⌘</span> Error debugger <span className="nav-chevron">›</span></a>
        <div className="sidebar-divider" />
        <div className="nav-label">YOUR FLOW</div>
        <div className="flow-item"><span className="flow-dot flow-green" /> Triage <span>01</span></div>
        <div className="flow-item"><span className="flow-dot flow-blue" /> Explain &amp; fix <span>02</span></div>
        <div className="flow-item"><span className="flow-dot flow-amber" /> Manual check <span className="flow-manual">03</span></div>
        <div className="sidebar-bottom">
          <div className="status-card">
            <div className="status-card-top"><span className={analysisConfigurationReady ? "pulse-dot" : "pulse-dot pulse-wait"} />Token Factory {tokenFactoryConfigured ? "configured" : configuration.tokenFactoryKeyPresent ? "model IDs needed" : "setup needed"}</div>
            <p>{tokenFactoryConfigured
              ? `Settings present · Tavily ${configuration.tavilyConfigured ? "ready" : "required"} · Ultra ${configuration.ultraConfigured ? "configured" : "off"}. ${configuration.tavilyConfigured ? "Account access is checked on first request." : configurationInstruction(configuration.environment, ["TAVILY_API_KEY"])}`
              : configuration.tokenFactoryKeyPresent
                ? `Key detected. Find your account-enabled Nemotron IDs. ${configurationInstruction(configuration.environment, ["NEMOTRON_NANO_MODEL and NEMOTRON_SUPER_MODEL"])} ${configuration.tavilyConfigured ? "" : configurationInstruction(configuration.environment, ["TAVILY_API_KEY"])}`
                : `${configurationInstruction(configuration.environment, ["NEBIUS_API_KEY and TAVILY_API_KEY"])} The keys stay on the server.`}</p>
            <p className="rate-limit-note">Limits: 8 analyses per visitor each minute; {configuration.globalDailyLimit} total analyses per UTC day {configuration.rateLimitStatus === "shared" ? "shared across instances" : configuration.rateLimitStatus === "local" ? "in this local process" : configuration.rateLimitStatus === "incomplete" ? "(shared Upstash settings incomplete)" : "(production requires shared Upstash settings)"}.</p>
            {configuration.tokenFactoryKeyPresent && !configuration.modelsConfigured && <button type="button" className="catalog-button" onClick={findAvailableModels} disabled={modelsLoading}>{modelsLoading ? "Checking Token Factory…" : "Find Nemotron model IDs"}</button>}
            {modelsMessage && <p className="catalog-message" role="status">{modelsMessage}</p>}
            {availableModels && availableModels.length > 0 && <ul className="model-catalog-list" aria-label="Nemotron models available to this API key">{availableModels.map((model) => <li key={model.id}><div className="model-catalog-heading"><strong>{model.name}</strong><button type="button" className="model-copy-button" onClick={() => copyModelId(model)} aria-label={`Copy ${model.environmentKey || `model ID ${model.id}`}`}>{copiedModelId === model.id ? "Copied" : model.tier ? `Copy ${model.tier}` : "Copy ID"}</button></div><code>{model.id}</code></li>)}</ul>}
            <a href="#setup-note">Setup status <span>↗</span></a>
          </div>
          <div className="profile-row">
            <div className="avatar">T</div>
            <div className="profile-copy"><strong>Tracekit</strong><span>Debug workspace</span></div>
            <span className="more-dots">···</span>
          </div>
        </div>
      </aside>

      <section className="main-area" id="top">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><b>/</b><strong>Error debugger</strong></div>
          <div className="topbar-right"><span className="local-pill"><i /> Keys stay server-side</span><button ref={helpToggleRef} type="button" className="icon-button" aria-label="Help" aria-expanded={helpOpen} aria-controls="help-panel" onClick={() => setHelpOpen((current) => !current)}>?</button></div>
        </header>

        <div className="content-wrap" id="debugger">
          <section className="help-panel" id="help-panel" aria-labelledby="help-title" hidden={!helpOpen}>
            <div className="help-panel-heading">
              <div><div className="help-kicker">QUICK GUIDE</div><h2 id="help-title">A careful debugging loop</h2></div>
              <button type="button" className="help-close" aria-label="Close help" onClick={closeHelp}>×</button>
            </div>
            <ol className="help-steps">
              <li><strong>Share useful context</strong><span>Paste the error and nearby code. Remove secrets and private data before submitting.</span></li>
              <li><strong>Review the proposal</strong><span>Nano classifies the issue, Tavily looks up current references, and Super drafts a fix. If configured, Ultra reviews deeper cases or a request for extra review.</span></li>
              <li><strong>Check it yourself</strong><span>Tracekit does not run code. Review the change, apply it, then rerun the failing case and a nearby edge case locally.</span></li>
            </ol>
            <p className="help-privacy"><strong>Data flow and usage:</strong> Your error and code are sent to Nebius Token Factory. Each analysis sends Tavily only a short, pattern-redacted query derived from the error; your code is not sent there. Pattern filters may miss some secrets. A live analysis usually makes two model requests and one search; each model stage can retry once if its response is unusable. An empty focused search can add an open Tavily search, and optional Ultra review can add a model request.</p>
          </section>
          <div className="hero-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> DEBUGGING, WITH DIRECTION</div>
              <h1>Find the <em>why.</em><br />Fix the right thing.</h1>
              <p className="hero-copy">{analysisConfigurationReady
                ? "Drop in an error and nearby code. Nano triages it, Tavily finds current references, and Super proposes a fix."
                : "Configure Nebius Token Factory and Tavily to run the full Nano → Tavily → Super diagnosis. Your error and code go to Nebius; Tavily receives only a short, redacted query derived from the error."}</p>
              {!analysisConfigurationReady && <p className="preview-note">New here? Try a quick-start example below. Choosing one only fills the fields; it sends no provider request and uses no credits.</p>}
            </div>
            <div className="hero-illustration" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <div className="hero-core"><span>⌁</span></div>
              <div className="float-card float-card-top"><span className="float-check">✓</span> likely cause</div>
              <div className="float-card float-card-bottom"><span className="float-code">&lt;/&gt;</span> proposed fix</div>
            </div>
          </div>

          <div className="quick-start">
            <span className="quick-label">TRY AN EXAMPLE</span>
            {ERROR_EXAMPLES.map((example, index) => (
              <button className="example-chip" key={example.label} onClick={() => applyExample(index)} disabled={loading}>
                <span className={`language-dot ${languageDotClasses[example.language]}`} />{example.label}<span className="chip-arrow">↗</span>
              </button>
            ))}
          </div>

          <section className="input-card">
            <div className="card-heading">
              <div className="step-number">01</div>
              <div><h2>Show us what happened</h2><p>Paste the error, then add the code near the line that failed.</p></div>
              <div className="input-heading-meta"><span className="lock-icon">↗</span> Error and code sent to Nebius</div>
            </div>
            <div className="input-grid">
              <div className="field-block">
                <div className="field-label">
                  <label className="field-title" htmlFor="error-input">ERROR MESSAGE</label>
                  <small>{error.length.toLocaleString()}/8,000 chars</small>
                </div>
                <textarea id="error-input" className="error-input" value={error} onChange={(event) => { setError(event.target.value); clearAnalysis(); }} placeholder="Paste your compiler error or stack trace…" spellCheck={false} maxLength={8000} disabled={loading} />
              </div>
              <div className="field-block">
                <div className="field-label">
                  <label className="field-title" htmlFor="code-input">CODE SNIPPET</label>
                  <small>{code.length.toLocaleString()}/12,000 chars</small>
                  <select aria-label="Programming language" value={language} onChange={(event) => { setLanguage(event.target.value as ProgrammingLanguage); clearAnalysis(); }} disabled={loading}>{SUPPORTED_LANGUAGES.map((supportedLanguage) => <option key={supportedLanguage}>{supportedLanguage}</option>)}</select>
                </div>
                <textarea id="code-input" className="code-input" value={code} onChange={(event) => { setCode(event.target.value); clearAnalysis(); }} placeholder="Paste the relevant code…" spellCheck={false} maxLength={12000} disabled={loading} />
              </div>
            </div>
            <details className="tavily-query-preview" open>
              <summary>Preview Tavily query</summary>
              <code>{tavilyQueryPreview}</code>
              <p>Pattern filters can miss secrets. Check this query before analysis. Nebius Token Factory receives the full error and code; Tavily receives only this query derived from the error, never the code.</p>
            </details>
            <div className="form-footer">
              <div className={`think-control ${configuration.ultraConfigured ? "" : "think-control-disabled"}`}><button type="button" role="switch" aria-label="Ask Nemotron Ultra for an extra review" aria-checked={thinkHarder} aria-describedby="think-harder-help" className={`switch ${thinkHarder ? "switch-on" : ""}`} onClick={() => { setThinkHarder((current) => !current); clearAnalysis(); }} disabled={loading || !configuration.ultraConfigured}><span /></button><span><strong>Think harder</strong><small id="think-harder-help">{configuration.ultraConfigured ? "Ask Nemotron Ultra for an extra review" : "Add an Ultra model ID to enable this review"}</small></span></div>
              <button className={`analyze-button ${loading ? "analyze-button-stop" : ""}`} onClick={loading ? stopAnalysis : analyze} disabled={!loading && !analysisConfigurationReady} aria-describedby={!analysisConfigurationReady ? "analysis-setup-hint" : undefined} aria-label={loading ? "Stop analysis" : "Trace this error"}><span className="analyze-spark">{loading ? "×" : "✳"}</span>{loading ? "Stop analysis" : "Trace this error"}<span className="button-arrow">{loading ? <span className="spinner" /> : "→"}</span></button>
            </div>
            {!analysisConfigurationReady && <p className="setup-hint" id="analysis-setup-hint" role="status">Analysis is disabled until required setup is present. {analysisSetupHint}</p>}
            {message && <div className="notice" role="alert"><span>!</span>{message}</div>}
          </section>

          {loading && <div ref={loadingCardRef} className="loading-card" role="status" aria-live="polite"><div className="loading-orb"><span /></div><div><strong>Following the live pipeline</strong><p>{activeProgress?.detail || "Starting the analysis stages…"}</p></div><div className="loading-steps" aria-label="Analysis stage progress">{progressStages.map(({ id, label }, index) => { const stage = analysisProgress[id]; return <span className={`loading-stage step-${stage.status}`} key={id}><strong>0{index + 1}&nbsp; {label}</strong>{stage.detail && stage.status !== "active" && <small>{stage.detail}</small>}</span>; })}</div></div>}

          {result && <section className="results-area" aria-live="polite">
            <div className="results-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> ANALYSIS COMPLETE</div><h2>Here’s what the error is telling you.</h2></div><span className="grounded-badge"><i className={result.referencesAvailable ? "grounded-dot" : "grounded-dot muted-dot"} />{result.referencesAvailable ? "Live references retrieved" : "No live references"}</span></div>
            <div className="pipeline-strip">
              {result.pipeline.map((step, index) => <div key={step.name} data-stage={step.name} className={`pipeline-stage ${step.status === "skipped" ? "stage-skipped" : ""}`}><span className="pipeline-index">0{index + 1}</span><span><strong>{step.name}</strong><small>{step.detail}</small></span><span className="pipeline-mark">{step.status === "complete" ? "✓" : "–"}</span></div>)}
            </div>
            <div className="result-grid">
              <div className="result-main">
                <article className="diagnosis-card">
                  <div className="diagnosis-top">
                    <span className="category-pill">{categoryLabels[result.triage.category] || result.triage.category}</span>
                    <span className={`severity-pill severity-${result.triage.severity}`}>{result.triage.severity} severity</span>
                    <span className="confidence">
                      {result.triage.confidence === null
                        ? "Confidence unavailable"
                        : `Model estimate · ${Math.round(result.triage.confidence * 100)}%`}
                    </span>
                  </div>
                  <h3>{result.rootCause}</h3><p>{result.explanation}</p>
                  {result.sourceReferences.length > 0 && <div className="citation-links" aria-label="References cited by the model"><span className="citation-label">CITED REFERENCES</span>{result.sourceReferences.map((referenceNumber) => { const source = result.sources[referenceNumber - 1]; return <a href={source.url} target="_blank" rel="noreferrer" key={referenceNumber}>[{referenceNumber}] {source.title}</a>; })}</div>}
                  <div className="summary-rule"><span />{result.triage.summary}</div>
                </article>
                <article className="fix-card">
                  <div className="fix-card-head"><div><div className="fix-kicker"><span>02</span> PROPOSED FIX</div><h3>Try this change</h3></div><button className="copy-button" onClick={copyFix} disabled={!hasSuggestedChange}>{copied ? "Copied ✓" : hasSuggestedChange ? "Copy code ↗" : "No code edit"}</button></div>
                  {result.fixSteps.length > 0 && <ol className="fix-steps">{result.fixSteps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span>{step}</li>)}</ol>}
                  <div className="diff-box">
                    <div className="diff-toolbar"><span><i /> {language.toLowerCase()} · {hasSuggestedChange ? "suggested edit" : "no code change returned"}</span>{hasSuggestedChange && <span className="diff-legend"><b className="legend-add">+</b> add <b className="legend-remove">−</b> remove</span>}</div>
                    {hasSuggestedChange ? <>
                      {isCondensedDiff && <div role="note" style={{ padding: "8px 10px", borderBottom: "1px solid #e9ede8", background: "#fbfcfa", fontSize: "9px", color: "#626e65" }}>Large comparison: line groups are condensed to keep this view responsive. All lines remain visible.</div>}
                      <pre>{diff.map((line, index) => <span className={`diff-line diff-${line.kind}`} key={`${index}-${line.kind}`}><i>{line.kind === "added" ? "+" : line.kind === "removed" ? "−" : " "}</i><code>{line.text || " "}</code></span>)}</pre>
                    </> : <div style={{ padding: "14px", fontSize: "10px", lineHeight: 1.6, color: "#626e65" }}>The model kept the snippet unchanged. Use the explanation and steps to make the edit manually, then check your result locally.</div>}
                  </div>
                  <div className="verify-note"><span className="verify-icon">↗</span><div><strong>Before you ship it</strong><p>{result.verificationNotes} Tracekit did not execute this code.</p></div><span className="verify-label">MANUAL CHECK</span></div>
                </article>
              </div>
              <aside className="result-side">
                <article className="next-card"><div className="side-card-heading"><span className="side-icon">↗</span><span>NEXT STEP</span></div><h3>Make sure it stays fixed.</h3><p>{hasSuggestedChange ? "Review and apply the proposed change, then run your existing test or the smallest input that reproduced this error." : "Use the explanation and fix steps to make the edit yourself, then run your existing test or the smallest input that reproduced this error."}</p><div className="next-divider" /><p className="checklist-note">Mark each step after checking it locally.</p><button type="button" className={`todo-line ${verificationChecks.failingCase ? "todo-line-checked" : ""}`} aria-pressed={verificationChecks.failingCase} onClick={() => setVerificationChecks((current) => ({ ...current, failingCase: !current.failingCase }))}><span className="todo-box">{verificationChecks.failingCase ? "✓" : ""}</span>I reran the failing case</button><button type="button" className={`todo-line ${verificationChecks.edgeCase ? "todo-line-checked" : ""}`} aria-pressed={verificationChecks.edgeCase} onClick={() => setVerificationChecks((current) => ({ ...current, edgeCase: !current.edgeCase }))}><span className="todo-box">{verificationChecks.edgeCase ? "✓" : ""}</span>I checked a nearby edge case</button></article>
                <article className="sources-card"><div className="side-card-heading"><span className="source-icon">◎</span><span>REFERENCE NOTES</span></div>{result.sources.length ? <div className="source-list">{result.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><strong>{source.title}</strong><small className="source-domain">{new URL(source.url).hostname}</small><span>{source.content}</span><i>Open source ↗</i></a>)}</div> : <p className="source-empty">{sourceEmptyMessage}</p>}<div className="source-foot">{result.sources.length > 0 ? result.sources.length + " SOURCE" + (result.sources.length === 1 ? "" : "S") + " RETRIEVED FOR THIS ERROR" : "NO SOURCES RETRIEVED"}</div></article>
              </aside>
            </div>
            <div className="model-footnote">Models queried: {result.modelUsed.triage} → {result.modelUsed.fix}{result.modelUsed.deepReasoning ? ` → ${result.modelUsed.deepReasoning}` : ""}<br />{modelResponseCount} model responses · {result.modelUsage.totalTokens !== undefined ? `${result.modelUsage.totalTokens.toLocaleString()} tokens reported` : "token counts not returned by every model"}{totalReasoningTokens > 0 ? ` · ${totalReasoningTokens.toLocaleString()} reasoning tokens reported` : ""} · {(result.modelUsage.totalDurationMs / 1000).toFixed(1)}s model time</div>
          </section>}

          <footer className="page-footer" id="setup-note"><span>Built for the bugs between class and the deadline.</span><span>Tracekit <i>·</i> Nebius Token Factory <i>·</i> Nemotron</span></footer>
        </div>
      </section>
    </main>
  );
}
