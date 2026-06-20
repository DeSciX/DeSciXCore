/**
 * Authentication Guard
 * 
 * Enforces authentication requirement for CLI/MCP commands.
 * Unlike the PWA which allows guest browsing, CLI and MCP require authentication.
 */

import chalk from 'chalk';
import { DeSciXApiClient } from './api-client.js';

/**
 * Require authentication before executing a command
 * @param {DeSciXApiClient} apiClient - API client instance
 * @returns {Promise<Object>} User information if authenticated
 */
export async function requireAuth(apiClient) {
  // Load credentials from wallet file
  await apiClient.loadCredentials();
  
  if (!apiClient.hasCredentials()) {
    console.error(chalk.red('\n  Authentication required.\n'));
    console.error(chalk.white('  Please sign up with DeSciX to use this feature.\n'));
    console.error(chalk.cyan('  Run: descix login\n'));
    process.exit(1);
  }
  
  // Validate session is still active by calling validate_session via HTTP
  try {
    const response = await apiClient.invoke('validate_session', {}, { allowGuest: false });
    if (response.status === 'OK' && response.message) {
      return response.message;
    }
    throw new Error('Invalid session');
  } catch (error) {
    if (error.message.includes('expired') || 
        error.message.includes('invalid') || 
        error.message.includes('Authentication required') ||
        error.message.includes('User session invalid')) {
      console.error(chalk.yellow('\n  Session expired or invalid.\n'));
      console.error(chalk.white('  Please sign in again.\n'));
      console.error(chalk.cyan('  Run: descix login\n'));
      process.exit(1);
    }
    // Other errors (network, etc.) - rethrow
    throw error;
  }
}

/**
 * Check if user is authenticated (non-blocking)
 * @param {DeSciXApiClient} apiClient - API client instance
 * @returns {Promise<boolean>} True if authenticated
 */
export async function isAuthenticated(apiClient) {
  try {
    await apiClient.loadCredentials();
    if (!apiClient.hasCredentials()) {
      return false;
    }
    // Try a lightweight check via HTTP
    const response = await apiClient.invoke('validate_session', {}, { allowGuest: false });
    return response.status === 'OK';
  } catch (error) {
    return false;
  }
}

