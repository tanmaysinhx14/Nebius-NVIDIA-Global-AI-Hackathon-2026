# Deployment runbook

This guide prepares Tracekit for a Vercel deployment. A live deployment has not been attempted. This workspace has a local Git repository on `main`, but no commit or remote yet; no Token Factory, Tavily, or Upstash credentials are configured.

## Before deployment

- Create or select a Nebius Token Factory account and confirm the exact model IDs and access for Nano and Super. Ultra is optional.
- Create an Upstash Redis database and keep its REST URL and token available for server-side environment settings.
- Create a Vercel account and install the Vercel CLI, or use the Vercel dashboard to import the project after it is pushed to a Git host.
- Confirm the deployment plan supports the analyze route's 60-second function duration. Tracekit exports `maxDuration = 60` from `app/api/analyze/route.ts`; the models route exports 15 seconds. The analysis pipeline budgets at most 54 seconds for request handling and stages, leaving response headroom. Tavily is a required stage before Super; Ultra is optional and may be skipped when little time remains.

The app requires Node.js 20.19 or later. From the project root, install and build it with:

```powershell
npm ci
npm run lint
npm run build
```

## Configure production environment

In the Vercel project settings, add these variables to the **Production** environment:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEBIUS_API_KEY` | Yes | Token Factory key; keep server-side. |
| `NEMOTRON_NANO_MODEL` | Yes | Exact Nano model ID enabled for the account. |
| `NEMOTRON_SUPER_MODEL` | Yes | Exact Super model ID enabled for the account. |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL for shared production rate limits. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Server-only REST token; also used to HMAC client IP identifiers. |
| `NEMOTRON_ULTRA_MODEL` | No | Enables the optional deeper review. |
| `TAVILY_API_KEY` | Yes | Required for the pre-Super reference search; receives only a redacted error signature. |
| `NEBIUS_BASE_URL` | No | Defaults to `https://api.tokenfactory.nebius.com/v1`. |

Use Vercel's environment-variable settings for secrets instead of committing `.env.local` or putting credentials in `NEXT_PUBLIC_*` variables. Add values to Preview only if preview deployments should make live provider calls; use a separate Upstash database if you need preview rate-limit data isolated from production. Changes to environment variables apply to subsequent deployments, so redeploy after changing them.

Tracekit's production API routes require the shared Upstash limiter. They fail closed if its credentials are missing or Upstash is unreachable. Local development's in-process fallback is not suitable for a serverless deployment.

Keep Vercel's [system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables) exposed so the runtime receives `VERCEL=1` and selects Vercel's [documented `x-vercel-forwarded-for` header](https://vercel.com/docs/headers/request-headers); with that marker present, a missing forwarded IP makes the limiter fail closed. If the marker is disabled, the resolver takes its non-Vercel path, so verify the project setting before production use. On non-Vercel hosts, configure the reverse proxy to overwrite `x-real-ip` or `x-forwarded-for` with the verified client address and strip any client-supplied copies.

## Deploy

### Vercel CLI

From the project root, sign in and link the folder to a Vercel project:

```powershell
npx vercel login
npx vercel
```

The first `vercel` run creates or links the project and produces a preview deployment. Add the production environment variables in the Vercel dashboard, then publish with:

```powershell
npx vercel --prod
```

Vercel CLI can deploy a local project without Git metadata. For a Git-based workflow, push the project to its intended repository and import that repository in Vercel instead.

### Vercel dashboard

Import the intended Git repository, set its root directory to the project root, confirm the detected Next.js settings, add the production environment variables, and deploy. Future pushes to the configured production branch will create deployments according to the Vercel project settings.

## Verify the live app

1. Open the deployed site and confirm the workspace renders.
2. Check the setup card. It should report Token Factory configured and a shared production limiter. These indicators only confirm that settings are present; they do not validate credentials or service access.
3. If a required model ID is blank, use **Find Nemotron model IDs**, select IDs that are enabled in the account, update the Vercel variables, and redeploy.
4. Submit one built-in example to exercise the live analysis route. Confirm stage progress completes and the result includes its classification, explanation, and proposed change. A live request sends the snippet to Nebius and may consume account credits.
5. Submit an example that benefits from a reference and confirm the Tavily stage completes before Super. When Tavily returns matching sources, confirm the result links only to cited sources; also check that no-match and search-failure states are disclosed.
6. Inspect Vercel function logs for provider or limiter errors. Do not treat a configured status card as proof of a successful provider call.

## Troubleshooting

- **Production says the limiter is unavailable:** check both Upstash variables, confirm the REST credentials belong to a live database, and inspect function logs for connection errors. Redeploy after changing variables.
- **Model discovery returns no usable ID or analysis reports a model error:** verify the model ID spelling and that the account has access to that model. Update the matching Vercel variable and redeploy.
- **The analysis request times out:** check provider latency and function logs, and confirm the Vercel plan supports the route's 60-second maximum duration.
- **The setup card looks ready but calls fail:** the card checks for non-empty settings only. Use the first live request and function logs to validate actual credentials and upstream access.

## Official setup references

- [Vercel CLI deployments](https://vercel.com/docs/deployments)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel function duration configuration](https://vercel.com/docs/functions/configuring-functions/duration)
- [Upstash rate-limit setup](https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted)
