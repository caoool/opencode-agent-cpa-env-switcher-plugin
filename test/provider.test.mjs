import assert from "node:assert/strict"
import test from "node:test"

import {
  applyActiveProvider,
  resolveActiveProvider,
  rewriteModelProvider,
} from "../dist/provider.js"

test("resolveActiveProvider accepts both supported providers", () => {
  assert.equal(resolveActiveProvider({ CPA_PROVIDER: "cpa-jp-edge" }), "cpa-jp-edge")
  assert.equal(resolveActiveProvider({ CPA_PROVIDER: " cpa-van-base " }), "cpa-van-base")
})

test("resolveActiveProvider rejects missing and unsupported providers", () => {
  assert.throws(() => resolveActiveProvider({}), /CPA_PROVIDER is required/)
  assert.throws(
    () => resolveActiveProvider({ CPA_PROVIDER: "other-provider" }),
    /Unsupported CPA_PROVIDER value/,
  )
})

test("rewriteModelProvider switches only known CPA provider prefixes", () => {
  assert.equal(
    rewriteModelProvider("cpa-jp-edge/gpt-5.6-sol", "cpa-van-base"),
    "cpa-van-base/gpt-5.6-sol",
  )
  assert.equal(
    rewriteModelProvider("cpa-van-base/claude-fable-5", "cpa-jp-edge"),
    "cpa-jp-edge/claude-fable-5",
  )
  assert.equal(
    rewriteModelProvider("anthropic/claude-sonnet-4-6", "cpa-van-base"),
    "anthropic/claude-sonnet-4-6",
  )
  assert.equal(rewriteModelProvider("invalid", "cpa-van-base"), "invalid")
})

test("rewriteModelProvider resolves the {env:CPA_PROVIDER} placeholder", () => {
  assert.equal(
    rewriteModelProvider("{env:CPA_PROVIDER}/gpt-5.6-sol", "cpa-van-base"),
    "cpa-van-base/gpt-5.6-sol",
  )
  assert.equal(
    rewriteModelProvider("{env:CPA_PROVIDER}/claude-fable-5", "cpa-jp-edge"),
    "cpa-jp-edge/claude-fable-5",
  )
  // Unrelated placeholders are left untouched.
  assert.equal(
    rewriteModelProvider("{env:OTHER}/gpt-5.6-sol", "cpa-van-base"),
    "{env:OTHER}/gpt-5.6-sol",
  )
})

test("applyActiveProvider rewrites defaults, agents, modes, and commands", () => {
  const config = {
    model: "{env:CPA_PROVIDER}/gpt-5.6-sol",
    small_model: "{env:CPA_PROVIDER}/gpt-5.6-luna",
    provider: {
      "cpa-van-base": {
        name: "CLI Proxy API VAN Base",
      },
    },
    agent: {
      orchestrator: { model: "{env:CPA_PROVIDER}/gpt-5.6-sol", variant: "fast-xhigh" },
      architect: { model: "cpa-jp-edge/claude-fable-5" },
      external: { model: "anthropic/claude-sonnet-4-6" },
      disabled: { disable: true },
    },
    mode: {
      legacy: { model: "{env:CPA_PROVIDER}/gpt-5.6-terra" },
    },
    command: {
      review: { template: "Review", model: "cpa-jp-edge/gpt-5.6-luna" },
    },
  }

  applyActiveProvider(config, "cpa-van-base")

  assert.equal(config.model, "cpa-van-base/gpt-5.6-sol")
  assert.equal(config.small_model, "cpa-van-base/gpt-5.6-luna")
  assert.equal(config.agent.orchestrator.model, "cpa-van-base/gpt-5.6-sol")
  assert.equal(config.agent.architect.model, "cpa-van-base/claude-fable-5")
  assert.equal(config.agent.external.model, "anthropic/claude-sonnet-4-6")
  assert.equal(config.mode.legacy.model, "cpa-van-base/gpt-5.6-terra")
  assert.equal(config.command.review.model, "cpa-van-base/gpt-5.6-luna")
})

test("applyActiveProvider rejects a provider missing from resolved config", () => {
  assert.throws(
    () => applyActiveProvider({ provider: {} }, "cpa-van-base"),
    /is not defined in the resolved OpenCode provider configuration/,
  )
})
