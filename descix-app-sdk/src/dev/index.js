export { createViteProxyConfig } from './createViteProxyConfig.js';
export {
  getViteHttpsConfig,
  certificateSanNames,
  assertCertHasLocalhostSan,
  DEFAULT_CERT_DIR,
  MINT_CERT_COMMAND,
} from './getViteHttpsConfig.js';
export { createViteServerConfig } from './createViteServerConfig.js';
export { watchWorkspaceConfig } from './watchWorkspaceConfig.js';
export { runGateway, buildGatewayProxy } from './gateway.js';
export {
  resolveGatewayTargets,
  resolveApiTarget,
  resolveSiteTarget,
  proxyEntry,
  isLocalOrigin,
  CLOUD_DEV_URL,
} from './resolveGatewayTargets.js';
export { buildWorkspaceProducts, resolveAppGatewayUrl } from './workspaceProducts.js';
export { workspaceProductsPlugin, WORKSPACE_PRODUCTS_VIRTUAL_ID, WORKSPACE_PRODUCTS_HMR_EVENT } from './workspaceProductsPlugin.js';
