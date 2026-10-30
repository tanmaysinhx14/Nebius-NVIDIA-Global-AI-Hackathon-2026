import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const RATE_LIMIT_WINDOW_MS = 60_000;
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1_000;
const RATE_LIMITS = { analysis: 8, models: 20 } as const;
const LOCAL_BUCKET_LIMIT = 5_000;
const localBuckets = new Map<string, { count: number; resetsAt: number }>();

export const DEFAULT_GLOBAL_DAILY_ANALYSIS_LIMIT = 50;
export type RateLimitScope = keyof typeof RATE_LIMITS | "analysis-daily";

export function getGlobalDailyAnalysisLimit(): number {
  const configured = Number(process.env.TRACEKIT_DAILY_ANALYSIS_LIMIT);
  return Number.isInteger(configured) && configured >= 1 && configured <= 10_000
    ? configured
    : DEFAULT_GLOBAL_DAILY_ANALYSIS_LIMIT;
}

export type RateLimitDecision = {
  unavailable?: boolean;
  waitSeconds: number;
  limit: number;
  remaining: number;
  resetsAt: number;
};

type SharedLimiter = {
  url: string;
  token: string;
  limit: number;
  limiter: Ratelimit;
};

const sharedLimiters = new Map<RateLimitScope, SharedLimiter>();

function getClientAddress(request: Request): string | null {
  const address = process.env.VERCEL === "1"
    ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return address && address.length <= 128 ? address : null;
}

function checkLocalLimit(request: Request, scope: RateLimitScope, limit: number): RateLimitDecision {
  const now = Date.now();
  const resetsAt = scope === "analysis-daily"
    ? Math.floor(now / DAILY_WINDOW_MS) * DAILY_WINDOW_MS + DAILY_WINDOW_MS
    : now + RATE_LIMIT_WINDOW_MS;
  const clientKey = scope === "analysis-daily" ? `${scope}:all` : `${scope}:${getClientAddress(request) || "local"}`;
  let bucket = localBuckets.get(clientKey);

  if (!bucket || now >= bucket.resetsAt) {
    if (!bucket && localBuckets.size >= LOCAL_BUCKET_LIMIT) {
      for (const [key, value] of localBuckets) {
        if (now >= value.resetsAt) localBuckets.delete(key);
      }
      if (localBuckets.size >= LOCAL_BUCKET_LIMIT) {
        return { waitSeconds: Math.max(1, Math.ceil((resetsAt - now) / 1000)), limit, remaining: 0, resetsAt };
      }
    }
    bucket = { count: 0, resetsAt };
    localBuckets.set(clientKey, bucket);
  }

  if (bucket.count >= limit) {
    return {
      waitSeconds: Math.max(1, Math.ceil((bucket.resetsAt - now) / 1000)),
      limit,
      remaining: 0,
      resetsAt: bucket.resetsAt,
    };
  }

  bucket.count += 1;
  return {
    waitSeconds: 0,
    limit,
    remaining: limit - bucket.count,
    resetsAt: bucket.resetsAt,
  };
}

function getSharedLimiter(url: string, token: string, scope: RateLimitScope, limit: number): Ratelimit {
  let cached = sharedLimiters.get(scope);
  if (!cached || cached.url !== url || cached.token !== token || cached.limit !== limit) {
    const redis = new Redis({
      url,
      token,
      retry: { retries: 0 },
      signal: () => AbortSignal.timeout(2_000),
    });
    cached = {
      url,
      token,
      limit,
      limiter: new Ratelimit({
        redis,
        limiter: scope === "analysis-daily" ? Ratelimit.fixedWindow(limit, "1 d") : Ratelimit.slidingWindow(limit, "1 m"),
        prefix: `tracekit:${scope}`,
      }),
    };
    sharedLimiters.set(scope, cached);
  }
  return cached.limiter;
}

export async function checkRateLimit(request: Request, scope: RateLimitScope): Promise<RateLimitDecision> {
  const limit = scope === "analysis-daily" ? getGlobalDailyAnalysisLimit() : RATE_LIMITS[scope];
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (Boolean(url) !== Boolean(token)) return { unavailable: true, waitSeconds: 0, limit, remaining: 0, resetsAt: Date.now() };
  if (!url || !token) {
    return process.env.NODE_ENV === "production"
      ? { unavailable: true, waitSeconds: 0, limit, remaining: 0, resetsAt: Date.now() }
      : checkLocalLimit(request, scope, limit);
  }

  const clientAddress = scope === "analysis-daily" ? null : getClientAddress(request);
  if (scope !== "analysis-daily" && !clientAddress) {
    return process.env.NODE_ENV === "production"
      ? { unavailable: true, waitSeconds: 0, limit, remaining: 0, resetsAt: Date.now() }
      : checkLocalLimit(request, scope, limit);
  }

  try {
    const identifier = scope === "analysis-daily"
      ? "all"
      : createHmac("sha256", token).update(clientAddress!).digest("hex");
    const result = await getSharedLimiter(url, token, scope, limit).limit(identifier);
    if (result.reason === "timeout") {
      return { unavailable: true, waitSeconds: 0, limit: result.limit, remaining: 0, resetsAt: result.reset };
    }
    return {
      waitSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      limit: result.limit,
      remaining: result.remaining,
      resetsAt: result.reset,
    };
  } catch {
    console.error("Shared analysis rate limiter is unavailable.");
    return { unavailable: true, waitSeconds: 0, limit, remaining: 0, resetsAt: Date.now() };
  }
}
