/**
 * @descix/platform-api - Permissions
 *
 * Pure role-based permission checks. No Google Groups dependency.
 * Google Groups-based admin checks (isPlatformAdmin, isCommunityAdmin, isAppAdmin,
 * checkUserPermission) remain in DeSciX_Cloud/microservice/services/permissionService.js
 * as they depend on Cloud-specific infrastructure (googleGroupsService.js).
 */

import { CacheFirestore, FirestoreCollections } from '@descix/cloud-core';

/**
 * Role-based permission check using Firestore role definitions.
 * Checks if a user has a specific permission via any of their assigned roles.
 *
 * @param {Object} user - The user object with a roles Map
 * @param {string} requiredPermission - The permission string to check
 * @param {Object} scopeContext - Context { communityId?, appId? } for scoped permissions
 * @returns {Promise<boolean>} - True if the user has the permission via roles
 */
export async function checkRoleBasedPermission(user, requiredPermission, scopeContext = {}) {
    if (!user || !user.roles || user.roles.size === 0) {
        return false;
    }

    const db = new CacheFirestore();

    for (const [roleId] of user.roles.entries()) {
        // Parse scope and ID from the roleId string
        let roleDefScope = 'UNKNOWN';
        let roleDefScopeId = null;
        let roleDefRoleId = roleId;

        const roleParts = roleId.split('_');
        if (roleParts[0].toLowerCase() === 'platform') {
            roleDefScope = 'PLATFORM';
            roleDefScopeId = 'descix';
        } else if (roleParts[0].toLowerCase() === 'community' && roleParts.length >= 3) {
            roleDefScope = 'COMMUNITY';
            roleDefScopeId = roleParts[1];
        } else if (roleParts[0].toLowerCase() === 'app' && roleParts.length >= 3) {
            roleDefScope = 'APP';
            roleDefScopeId = roleParts[1];
        } else {
            continue;
        }

        try {
            const collectionPath = FirestoreCollections.ROLES(roleDefScope, roleDefScopeId);
            const roleData = await db.get_doc(collectionPath, roleDefRoleId);

            if (roleData && roleData.permissions?.includes(requiredPermission)) {
                const [roleCommunityId, roleAppId] = String(roleData.scope_id).split('/');
                const hasPermissionInScope = () => {
                    switch (roleData.scope?.toUpperCase()) {
                        case 'PLATFORM':
                            return true;
                        case 'COMMUNITY':
                            return scopeContext.communityId === roleData.scope_id ||
                                   (scopeContext.appId && scopeContext.communityId === roleData.scope_id);
                        case 'APP':
                            return scopeContext.communityId === roleCommunityId && scopeContext.appId === roleAppId;
                        default:
                            return false;
                    }
                };

                if (hasPermissionInScope()) {
                    return true;
                }
            }
        } catch (error) {
            console.error(`[checkRoleBasedPermission] Error fetching role definition for ${roleId}:`, error);
        }
    }

    // NFT check for community management (backward compatibility)
    if (requiredPermission === 'COMMUNITY_MANAGE_APPS' && scopeContext.communityId) {
        if (user.nfts instanceof Map) {
            for (const nft of user.nfts.values()) {
                if (nft.community_id === scopeContext.communityId) {
                    return true;
                }
            }
        } else if (user.nfts && typeof user.nfts === 'object') {
            for (const nft of Object.values(user.nfts)) {
                if (nft.community_id === scopeContext.communityId) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Quick check if user has ANY admin access based on roles.
 * This is the role-only version — Google Groups admin checks remain in Cloud.
 *
 * @param {Object} user - The user object
 * @returns {Promise<boolean>} - True if user has any elevated role
 */
export async function hasAnyAdminAccess(user) {
    if (!user || !user.roles || user.roles.size === 0) {
        return false;
    }

    for (const [roleId] of user.roles.entries()) {
        if (roleId.toLowerCase().startsWith('platform_')) {
            return true;
        }
    }

    return false;
}

/**
 * Get user's admin scope based on their assigned roles.
 * Returns what level of admin access the user has from role assignments only.
 * Google Groups admin checks are handled by Cloud's permissionService.js.
 *
 * @param {Object} user - The user object
 * @param {string} communityId - Optional community context
 * @param {string} appId - Optional app context
 * @returns {Promise<Object>} - { isPlatformAdmin, isCommunityAdmin, isAppAdmin }
 */
export async function getUserAdminScope(user, communityId = null, appId = null) {
    const scope = {
        isPlatformAdmin: false,
        isCommunityAdmin: false,
        isAppAdmin: false
    };

    if (!user || !user.roles || user.roles.size === 0) {
        return scope;
    }

    for (const [roleId] of user.roles.entries()) {
        const lower = roleId.toLowerCase();
        if (lower.startsWith('platform_')) {
            scope.isPlatformAdmin = true;
            scope.isCommunityAdmin = true;
            scope.isAppAdmin = true;
            return scope;
        }
        if (communityId && lower.startsWith(`community_${communityId}_`)) {
            scope.isCommunityAdmin = true;
            scope.isAppAdmin = true;
        }
        if (communityId && appId && lower.startsWith(`app_${communityId}_${appId}_`)) {
            scope.isAppAdmin = true;
        }
    }

    return scope;
}
