/**
 * @descix/platform-api - Auth module
 *
 * Session management, email verification, and user migration utilities.
 */

export { createUserSession } from './session.js';
export { sendEmailVerification, verifyEmailCode } from './emailVerification.js';
export { migrateUserIfNeeded } from './migration.js';
