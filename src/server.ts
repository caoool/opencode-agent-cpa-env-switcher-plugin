import type { Plugin, PluginModule } from "@opencode-ai/plugin"
import { applyActiveProvider, resolveActiveProvider } from "./provider.js"

export const server: Plugin = async () => ({
  config: async (config) => {
    applyActiveProvider(config, resolveActiveProvider())
  },
})

const plugin = {
  id: "opencode-agent-cpa-env-switcher",
  server,
} satisfies PluginModule

export default plugin
