import { server } from "./server.js"

export default server
export { server }
export {
  PROVIDER_ENV,
  PROVIDER_PLACEHOLDER,
  SUPPORTED_PROVIDERS,
  applyActiveProvider,
  resolveActiveProvider,
  rewriteModelProvider,
  type SupportedProvider,
} from "./provider.js"
