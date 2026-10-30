export const SUPPORTED_LANGUAGES = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "Other"] as const;
export type ProgrammingLanguage = typeof SUPPORTED_LANGUAGES[number];

export function isProgrammingLanguage(value: unknown): value is ProgrammingLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as ProgrammingLanguage);
}

export type ErrorCategory = "syntax" | "runtime" | "logic" | "dependency" | "unknown";
export type Severity = "low" | "medium" | "high";
export const TRIAGE_SUMMARY_MAX_LENGTH = 500;

export interface Triage {
  category: ErrorCategory;
  severity: Severity;
  confidence: number | null;
  summary: string;
}

export interface SearchSource {
  title: string;
  url: string;
  content: string;
}

export const SEARCH_SOURCE_LIMITS = {
  title: 240,
  url: 2_048,
  content: 900,
} as const;
export const MAX_SEARCH_SOURCES = 3;

export interface ModelCallUsage {
  durationMs: number;
  attempts?: number;
  promptTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}

export interface ServiceConfiguration {
  environment: "development" | "production";
  tokenFactoryKeyPresent: boolean;
  modelsConfigured: boolean;
  tavilyConfigured: boolean;
  ultraConfigured: boolean;
  globalDailyLimit: number;
  rateLimitStatus: "shared" | "local" | "incomplete" | "missing-production";
}

export interface AvailableModel {
  id: string;
  name: string;
  tier?: "Nano" | "Super" | "Ultra";
  environmentKey?: "NEMOTRON_NANO_MODEL" | "NEMOTRON_SUPER_MODEL" | "NEMOTRON_ULTRA_MODEL";
}

export interface AnalysisResult {
  triage: Triage;
  rootCause: string;
  explanation: string;
  fixSteps: string[];
  fixedCode: string;
  verificationNotes: string;
  sourceReferences: number[];
  sources: SearchSource[];
  referencesAvailable: boolean;
  modelUsed: {
    triage: string;
    fix: string;
    deepReasoning?: string;
  };
  modelUsage: {
    triage: ModelCallUsage;
    fix: ModelCallUsage;
    deepReasoning?: ModelCallUsage;
    totalDurationMs: number;
    totalTokens?: number;
  };
  pipeline: Array<{ name: string; detail: string; status: "complete" | "skipped" }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function hasOptionalCount(record: Record<string, unknown>, key: string): boolean {
  return record[key] === undefined || isNonnegativeNumber(record[key]);
}

function hasOptionalAttemptCount(record: Record<string, unknown>): boolean {
  return record.attempts === undefined
    || (typeof record.attempts === "number" && Number.isInteger(record.attempts) && record.attempts >= 1);
}

function isModelCallUsage(value: unknown): value is ModelCallUsage {
  return isRecord(value)
    && isNonnegativeNumber(value.durationMs)
    && hasOptionalAttemptCount(value)
    && hasOptionalCount(value, "promptTokens")
    && hasOptionalCount(value, "completionTokens")
    && hasOptionalCount(value, "reasoningTokens")
    && hasOptionalCount(value, "totalTokens");
}

function isSearchSource(value: unknown): value is SearchSource {
  if (!isRecord(value) || typeof value.title !== "string" || typeof value.content !== "string" || typeof value.url !== "string") return false;
  if (
    value.title.length > SEARCH_SOURCE_LIMITS.title
    || value.url.length > SEARCH_SOURCE_LIMITS.url
    || value.content.length > SEARCH_SOURCE_LIMITS.content
    || !value.title.trim()
  ) return false;
  try {
    const url = new URL(value.url);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Validate the complete API result before the UI renders provider-controlled data. */
export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isRecord(value) || !isRecord(value.triage) || !isRecord(value.modelUsed) || !isRecord(value.modelUsage)) return false;

  const sources = value.sources;
  if (!Array.isArray(sources) || sources.length > MAX_SEARCH_SOURCES || !sources.every(isSearchSource)) return false;
  const sourceReferences = value.sourceReferences;
  if (
    !Array.isArray(sourceReferences)
    || sourceReferences.length > MAX_SEARCH_SOURCES
    || new Set(sourceReferences).size !== sourceReferences.length
    || !sourceReferences.every((reference) => typeof reference === "number" && Number.isInteger(reference) && reference >= 1 && reference <= sources.length)
  ) return false;

  const triage = value.triage;
  const categories: ErrorCategory[] = ["syntax", "runtime", "logic", "dependency", "unknown"];
  const severities: Severity[] = ["low", "medium", "high"];
  if (
    !categories.includes(triage.category as ErrorCategory)
    || !severities.includes(triage.severity as Severity)
    || (triage.confidence !== null && (!isNonnegativeNumber(triage.confidence) || triage.confidence > 1))
    || typeof triage.summary !== "string" || !triage.summary.trim() || triage.summary.length > TRIAGE_SUMMARY_MAX_LENGTH
    || typeof value.rootCause !== "string" || !value.rootCause.trim() || value.rootCause.length > 1_000
    || typeof value.explanation !== "string" || !value.explanation.trim() || value.explanation.length > 8_000
    || !Array.isArray(value.fixSteps) || value.fixSteps.length < 1 || value.fixSteps.length > 4
    || !value.fixSteps.every((step) => typeof step === "string" && step.trim().length > 0 && step.length <= 600)
    || typeof value.fixedCode !== "string" || !value.fixedCode.trim() || value.fixedCode.length > 32_000
    || typeof value.verificationNotes !== "string"
    || typeof value.referencesAvailable !== "boolean"
    || value.referencesAvailable !== (sources.length > 0)
  ) return false;

  const modelUsed = value.modelUsed;
  const modelUsage = value.modelUsage;
  if (
    typeof modelUsed.triage !== "string" || !modelUsed.triage
    || typeof modelUsed.fix !== "string" || !modelUsed.fix
    || (modelUsed.deepReasoning !== undefined && (typeof modelUsed.deepReasoning !== "string" || !modelUsed.deepReasoning))
    || !isModelCallUsage(modelUsage.triage)
    || !isModelCallUsage(modelUsage.fix)
    || (modelUsage.deepReasoning !== undefined && !isModelCallUsage(modelUsage.deepReasoning))
    || Boolean(modelUsed.deepReasoning) !== Boolean(modelUsage.deepReasoning)
    || !isNonnegativeNumber(modelUsage.totalDurationMs)
    || !hasOptionalCount(modelUsage, "totalTokens")
  ) return false;

  return Array.isArray(value.pipeline)
    && value.pipeline.length >= 3
    && value.pipeline.length <= 8
    && value.pipeline.every((step) => isRecord(step)
      && typeof step.name === "string" && step.name.length > 0
      && typeof step.detail === "string"
      && (step.status === "complete" || step.status === "skipped"));
}

export type AnalysisStage = "nano" | "tavily" | "super" | "ultra";

export type AnalysisStreamEvent =
  | { type: "progress"; stage: AnalysisStage; status: "active" | "complete" | "skipped" | "error"; detail: string }
  | { type: "complete"; result: AnalysisResult }
  | { type: "error"; error: string };
