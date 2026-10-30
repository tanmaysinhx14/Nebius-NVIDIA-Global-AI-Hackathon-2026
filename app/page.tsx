import Workspace from "@/components/Workspace";
import { getGlobalDailyAnalysisLimit } from "@/lib/rate-limit";
import type { ServiceConfiguration } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function Home() {
  const nanoModel = process.env.NEMOTRON_NANO_MODEL?.trim();
  const superModel = process.env.NEMOTRON_SUPER_MODEL?.trim();
  const rateLimitUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const rateLimitToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const rateLimitStatus: ServiceConfiguration["rateLimitStatus"] = rateLimitUrl && rateLimitToken ? "shared"
    : rateLimitUrl || rateLimitToken ? "incomplete"
      : process.env.NODE_ENV === "production" ? "missing-production"
        : "local";
  const configuration = {
    environment: process.env.NODE_ENV === "production" ? "production" as const : "development" as const,
    tokenFactoryKeyPresent: Boolean(process.env.NEBIUS_API_KEY?.trim()),
    modelsConfigured: Boolean(nanoModel && superModel),
    tavilyConfigured: Boolean(process.env.TAVILY_API_KEY?.trim()),
    ultraConfigured: Boolean(process.env.NEMOTRON_ULTRA_MODEL?.trim()),
    globalDailyLimit: getGlobalDailyAnalysisLimit(),
    rateLimitStatus,
  };
  return <Workspace configuration={configuration} />;
}
