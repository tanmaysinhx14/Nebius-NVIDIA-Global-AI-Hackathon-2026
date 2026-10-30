import { NextResponse } from "next/server";
import { configurationInstruction } from "@/lib/configuration-guidance";
import { readProviderJson } from "@/lib/provider-json";
import { hasSameOrigin } from "@/lib/request-origin";
import { checkRateLimit } from "@/lib/rate-limit";
import type { AvailableModel } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json(
      { error: "Cross-origin model discovery requests are not allowed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const rateLimit = await checkRateLimit(request, "models");
  if (rateLimit.unavailable) {
    return NextResponse.json(
      { error: "Model discovery is temporarily unavailable because the shared request limit could not be checked." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  const rateLimitHeaders = {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetsAt / 1000)),
    "Cache-Control": "no-store",
  };
  if (rateLimit.waitSeconds > 0) {
    return NextResponse.json(
      { error: "Too many model-list requests. Wait a moment, then try again." },
      { status: 429, headers: { ...rateLimitHeaders, "Retry-After": String(rateLimit.waitSeconds) } },
    );
  }

  const apiKey = process.env.NEBIUS_API_KEY?.trim();
  if (!apiKey) {
    const environment = process.env.NODE_ENV === "production" ? "production" : "development";
    return NextResponse.json(
      { error: `${configurationInstruction(environment, ["NEBIUS_API_KEY"])} Then retry model discovery.` },
      { status: 503, headers: rateLimitHeaders },
    );
  }

  const baseUrl = (process.env.NEBIUS_BASE_URL?.trim() || "https://api.tokenfactory.nebius.com/v1").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}/models?verbose=true`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(8_000)]),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Token Factory model discovery failed", response.status);
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({ error: "Token Factory rejected the API key or model-list access." }, { status: 503, headers: rateLimitHeaders });
      }
      if (response.status === 429) {
        return NextResponse.json({ error: "Token Factory rate-limited model discovery. Wait a moment, then retry." }, { status: 429, headers: rateLimitHeaders });
      }
      return NextResponse.json({ error: "Token Factory could not return the model list. Try again shortly." }, { status: 502, headers: rateLimitHeaders });
    }

    const payload = await readProviderJson(response);
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) throw new Error("Unexpected model-list response.");
    const data = (payload as { data?: unknown }).data;
    if (!Array.isArray(data)) throw new Error("Model list was missing.");

    const models: AvailableModel[] = data.flatMap((entry): AvailableModel[] => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
      const model = entry as { id?: unknown; name?: unknown };
      if (typeof model.id !== "string" || !/nemotron/i.test(`${model.id} ${typeof model.name === "string" ? model.name : ""}`)) return [];
      const name = typeof model.name === "string" && model.name.trim() ? model.name : model.id;
      const searchableName = `${model.id} ${name}`;
      const tier = /\bnano\b/i.test(searchableName) ? "Nano"
        : /\bsuper\b/i.test(searchableName) ? "Super"
          : /\bultra\b/i.test(searchableName) ? "Ultra"
            : undefined;
      const environmentKey = tier ? `NEMOTRON_${tier.toUpperCase()}_MODEL` as AvailableModel["environmentKey"] : undefined;
      return [{ id: model.id, name, ...(tier ? { tier, environmentKey } : {}) }];
    }).sort((left, right) => left.id.localeCompare(right.id));

    return NextResponse.json({ models }, { headers: rateLimitHeaders });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json({ error: "Token Factory model discovery timed out. Retry in a moment." }, { status: 504, headers: rateLimitHeaders });
    }
    console.error("Token Factory model discovery failed");
    return NextResponse.json({ error: "Token Factory returned an unreadable model list. Try again shortly." }, { status: 502, headers: rateLimitHeaders });
  }
}
