/** `@discord/embedded-app-sdk` for the harness: the non-embedded path never constructs it. */
export class DiscordSDK {
  constructor() {
    throw new Error('the harness runs non-embedded; DiscordSDK must not be constructed');
  }
}
export function patchUrlMappings() {
  throw new Error('the harness runs non-embedded; patchUrlMappings must not be called');
}
