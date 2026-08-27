/**
 * MOVED. The owner of this surface is now `@descix/cloud-core/manifest`.
 *
 * This file is a RE-EXPORT, not a copy, and that distinction is the point: during the move
 * there must never be an instant at which two locations hold the same fact. A copy left here
 * would be a second owner for as long as the companion repoint takes; a pointer is the same
 * owner reached by an older name.
 *
 * It exists only until DeSciX_Cloud's imports are repointed at `@descix/cloud-core/manifest`,
 * after which this file and its subpath export are DELETED. That repoint is a companion row
 * and is deliberately NOT part of this change.
 */
export * from '@descix/cloud-core/manifest';
