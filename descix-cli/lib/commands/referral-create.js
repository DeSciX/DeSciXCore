/**
 * `descix referral create` — mint the caller's share link to one page.
 *
 * Sends generate_referral_code with the share-link contract (@descix/app-sdk/share-link webPageMintParams:
 * a WEB_PAGE target, the page, the channel, the community) and prints the server's share_url,
 * `<page>?ref=<custom_id>`. The server is idempotent: asking again for the same page, channel and community
 * returns the same link (`created: false`), which is reported as such, never as a new link. A reply without
 * a share_url that carries its custom_id is a refusal (requireShareUrl). Every server refusal passes through
 * with its code.
 */
import chalk from 'chalk';
import { webPageMintParams, requireShareUrl } from '@descix/app-sdk/share-link';

/**
 * @param {{ invoke: Function }} apiClient
 * @param {{ url: string, channel: string, community: string }} options
 * @returns {Promise<{ share_url: string, custom_id: string, created: boolean }>}
 */
export async function runReferralCreate(apiClient, options) {
  if (!options.url) throw new Error('--url <page> is required');
  if (!options.channel) throw new Error('--channel <channel> is required');
  if (!options.community) throw new Error('-c, --community <id> is required');

  const params = webPageMintParams({ page: options.url, channel: options.channel, communityId: options.community });
  // A literal, so the verb→command graph (scripts/lib/verb-invoke-graph.mjs) attributes it; the gate
  // tests/referral-create.test.js holds it equal to @descix/app-sdk/share-link MINT_COMMAND.
  const response = await apiClient.invoke('generate_referral_code', params);
  const result = response?.message ?? response;
  const shareUrl = requireShareUrl(result);
  if (typeof result.created !== 'boolean') {
    throw new Error(`generate_referral_code returned no 'created' verdict: ${JSON.stringify(result)}`);
  }

  console.log(chalk.green(result.created ? '\n✅ Share link created.\n' : '\n✅ Share link (already yours; the same link as before).\n'));
  console.log(chalk.cyan(`  ${shareUrl}`));
  console.log(chalk.gray(`  Page: ${result.target_identifier}`));
  console.log(chalk.gray(`  Channel: ${result.channel}`));
  console.log(chalk.gray(`  Community: ${options.community}`));
  console.log(chalk.gray(`  Code: ${result.custom_id}\n`));
  return { share_url: shareUrl, custom_id: result.custom_id, created: result.created };
}
