export type DiffLine = { kind: "same" | "added" | "removed"; text: string; line: number; condensed?: boolean };

/** LCS diff for ordinary snippets, with a compact fallback for large comparisons. */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  if (a.length * b.length > 180_000) {
    let prefix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1;
    let suffix = 0;
    while (suffix < a.length - prefix && suffix < b.length - prefix && a[a.length - suffix - 1] === b[b.length - suffix - 1]) suffix += 1;
    const result: DiffLine[] = [];
    let outputLine = 1;
    const addGroup = (kind: DiffLine["kind"], lines: string[], start: number, end: number) => {
      if (start === end) return;
      result.push({ kind, text: lines.slice(start, end).join("\n"), line: outputLine, condensed: true });
      if (kind !== "removed") outputLine += end - start;
    };
    addGroup("same", a, 0, prefix);
    addGroup("removed", a, prefix, a.length - suffix);
    addGroup("added", b, prefix, b.length - suffix);
    addGroup("same", a, a.length - suffix, a.length);
    return result;
  }
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = Array.from({ length: rows }, () => new Uint16Array(cols));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let line = 1;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      result.push({ kind: "same", text: a[i], line });
      i += 1;
      j += 1;
      line += 1;
    } else if (j < b.length && (i === a.length || table[i][j + 1] >= table[i + 1][j])) {
      result.push({ kind: "added", text: b[j], line });
      j += 1;
      line += 1;
    } else {
      result.push({ kind: "removed", text: a[i], line });
      i += 1;
    }
  }
  return result;
}
