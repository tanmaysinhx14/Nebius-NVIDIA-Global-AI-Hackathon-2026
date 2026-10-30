const URL_PATTERN = /\b[a-z][a-z0-9+.-]*:\/\/\S+/gi;
const ERROR_SIGNATURE_PATTERN = /\b(?:[A-Z_$][A-Za-z0-9_.$]*(?:Error|Exception)|Error|Exception|BaseExceptionGroup|ExceptionGroup|StopAsyncIteration|StopIteration|SystemExit|KeyboardInterrupt|GeneratorExit|(?:fatal\s+)?error)\s*:/i;

// Match common credential field names and consume the entire quoted or bare value.
const CREDENTIAL_ASSIGNMENT_PATTERN = /\b[A-Za-z0-9._-]*(?:authorization|proxy[._-]?authorization|access[._-]?(?:token|key(?:[._-]?id)?)|refresh[._-]?token|auth(?:entication)?(?:[._-]?(?:key|token))?|token|key(?:[._-]?id)?|sig(?:nature)?|secret(?:[._-]?(?:access[._-]?)?key)?|password|passwd|pwd|passphrase|credentials?|cookie|session[._-]?(?:id|token))\b["'\x60]?\s*[:=]\s*(?:(?:Bearer|Basic|Token)\s+)?(?:"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)|\x60(?:\\.|[^\x60\\])*(?:\x60|$)|[^\s,;]+)/gi;

const AUTH_SCHEME_VALUE_PATTERN = /\b(?:Bearer|Basic|Token)\s+(?:"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)|\x60(?:\\.|[^\x60\\])*(?:\x60|$)|[^\s,;]+)/gi;
const KNOWN_TOKEN_FORMAT_PATTERN = /\b(?:tvly-[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9_-]{12,}|sk_(?:live|test)_[A-Za-z0-9_-]{12,}|github_pat_[A-Za-z0-9_]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|xox[baprs]-[A-Za-z0-9-]{12,}|glpat-[A-Za-z0-9_-]{12,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|ya29\.[A-Za-z0-9_-]{20,})\b/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
// If a quote is unclosed, consume the remaining one-line signature rather than risk a partial leak.
const QUOTED_TEXT_PATTERN = /"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)|\x60(?:\\.|[^\x60\\])*(?:\x60|$)/g;
const SHORT_DIAGNOSTIC_TOKEN_PATTERN = /^(?:[A-Za-z_][A-Za-z0-9_.$-]{0,63}|;)$/;
const RELATIVE_PATH_PATTERN = /(?:^|\s)(?:\.\.?[\\/])?(?:[\w.-]+[\\/])+[\w.-]+\.[A-Za-z0-9]{1,8}\b/g;
const ABSOLUTE_PATH_PATTERN = /(?:[A-Za-z]:)?[\\/][^\s:]*/g;

function preserveDiagnosticTokens(match: string): string {
  const quote = match[0];
  const closed = match.length > 1 && match[match.length - 1] === quote;
  if (!closed) return " ";
  const value = match.slice(1, -1);
  return SHORT_DIAGNOSTIC_TOKEN_PATTERN.test(value) ? ` ${value} ` : " ";
}

export function buildSearchQuery(language: string, error: string): string {
  const lines = error.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const signature = lines.slice().reverse().find((line) => ERROR_SIGNATURE_PATTERN.test(line)) || lines[0] || "programming error";
  const safeSignature = signature
    .replace(URL_PATTERN, " ")
    .replace(CREDENTIAL_ASSIGNMENT_PATTERN, " ")
    .replace(AUTH_SCHEME_VALUE_PATTERN, " ")
    .replace(KNOWN_TOKEN_FORMAT_PATTERN, " ")
    .replace(JWT_PATTERN, " ")
    .replace(EMAIL_PATTERN, " ")
    .replace(QUOTED_TEXT_PATTERN, preserveDiagnosticTokens)
    .replace(RELATIVE_PATH_PATTERN, " ")
    .replace(ABSOLUTE_PATH_PATTERN, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/[^a-zA-Z0-9_\s-;]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return language + " " + (safeSignature || "programming error") + " fix documentation";
}
