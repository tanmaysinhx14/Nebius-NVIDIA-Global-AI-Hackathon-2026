export type RuntimeEnvironment = "development" | "production";

export function configurationLocation(environment: RuntimeEnvironment): string {
  return environment === "production" ? "your deployment's production environment" : ".env.local";
}

export function configurationRefreshAction(environment: RuntimeEnvironment): string {
  return environment === "production" ? "redeploy" : "restart the dev server";
}

export function configurationInstruction(environment: RuntimeEnvironment, variables: string[]): string {
  const settings = variables.join(", ");
  return `Add ${settings} to ${configurationLocation(environment)}, then ${configurationRefreshAction(environment)}.`;
}
