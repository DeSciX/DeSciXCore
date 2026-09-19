/**
 * Mirror a community's IDENTITY — token symbol and icon — from the env-invariant descix-chain
 * registry into the current environment's records (CEO 2026-09-19).
 *
 * ONE owner for both callers: `descix app init` (run for a community's own app) and
 * `descix community refresh-identity`. The server reads the registry and verifies the icon
 * actually serves (update_community_metadata with from_registry); this module only asks and
 * reports, so the receipt shows what the SERVER read and wrote, never what we hoped.
 */
import chalk from 'chalk';

/**
 * @param {Object} apiClient
 * @param {string} communityId
 * @returns {Promise<Object>} the server's `registry` block
 * @throws {Error} when the server returns no registry block — an unreported mirror is not a mirror
 */
export async function refreshCommunityIdentity(apiClient, communityId) {
  const response = await apiClient.invoke('update_community_metadata', {
    community_id: communityId,
    from_registry: true,
  });
  const result = response.message || response;
  if (!result || !result.registry) {
    throw new Error(
      `update_community_metadata returned no registry block for '${communityId}' — the server did ` +
      `not report what it mirrored, so nothing can be claimed about it.`);
  }
  return result.registry;
}

/** Print what was read from the registry and what changed in this environment. */
export function printIdentityReceipt(communityId, registry) {
  const { token_symbol, icon_url, icon_status, before, community_app_updated } = registry;
  console.log(chalk.cyan(`\n  Identity for ${communityId} (from the descix-chain registry):`));
  const sym = before?.token_symbol === token_symbol ? 'unchanged' : `was ${before?.token_symbol ?? 'unset'}`;
  console.log(chalk.gray(`    Token symbol: ${token_symbol}  (${sym})`));
  if (icon_url) {
    const ic = before?.icon_url === icon_url ? 'unchanged' : 'updated';
    console.log(chalk.gray(`    Icon:         ${icon_url}  (${ic}, ${icon_status})`));
  } else {
    console.log(chalk.yellow(`    Icon:         not written — the registry icon is ${icon_status}. The store shows a monogram.`));
  }
  console.log(chalk.gray(`    Community app record: ${community_app_updated ? 'updated' : 'not found in this environment'}`));
}
