import type { Config } from "@opencode-ai/plugin"

export const PROVIDER_ENV = "CPA_PROVIDER"

export const SUPPORTED_PROVIDERS = ["cpa-jp-edge", "cpa-van-base"] as const

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

const providerSet = new Set<string>(SUPPORTED_PROVIDERS)

type ModelConfig = {
  model?: string
}

export function resolveActiveProvider(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SupportedProvider {
  const value = env[PROVIDER_ENV]?.trim()
  if (!value) {
    throw new Error(
      `[cpa-env-switcher] ${PROVIDER_ENV} is required. Expected one of: ${SUPPORTED_PROVIDERS.join(", ")}`,
    )
  }
  if (!providerSet.has(value)) {
    throw new Error(
      `[cpa-env-switcher] Unsupported ${PROVIDER_ENV} value ${JSON.stringify(value)}. Expected one of: ${SUPPORTED_PROVIDERS.join(", ")}`,
    )
  }
  return value as SupportedProvider
}

export function rewriteModelProvider(model: string, provider: SupportedProvider): string {
  const separator = model.indexOf("/")
  if (separator <= 0) return model

  const currentProvider = model.slice(0, separator)
  if (!providerSet.has(currentProvider)) return model

  return `${provider}${model.slice(separator)}`
}

function rewriteModelConfig(config: ModelConfig | undefined, provider: SupportedProvider): void {
  if (!config || typeof config.model !== "string") return
  config.model = rewriteModelProvider(config.model, provider)
}

export function applyActiveProvider(config: Config, provider: SupportedProvider): void {
  if (!config.provider?.[provider]) {
    throw new Error(
      `[cpa-env-switcher] Selected provider ${JSON.stringify(provider)} is not defined in the resolved OpenCode provider configuration`,
    )
  }

  if (typeof config.model === "string") {
    config.model = rewriteModelProvider(config.model, provider)
  }
  if (typeof config.small_model === "string") {
    config.small_model = rewriteModelProvider(config.small_model, provider)
  }

  for (const agent of Object.values(config.agent ?? {})) {
    rewriteModelConfig(agent, provider)
  }
  for (const mode of Object.values(config.mode ?? {})) {
    rewriteModelConfig(mode, provider)
  }
  for (const command of Object.values(config.command ?? {})) {
    rewriteModelConfig(command, provider)
  }
}
