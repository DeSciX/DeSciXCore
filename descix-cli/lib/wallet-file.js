/**
 * Wallet File Manager
 * 
 * Self-contained wallet file management for CLI/MCP.
 * No service imports - pure file system operations.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';

export class WalletFileManager {
  /**
   * Get default wallet file path
   * Stores in user's home directory under .descix/wallet.json
   */
  static getDefaultWalletPath() {
    const homeDir = os.homedir();
    const descixDir = path.join(homeDir, '.descix');
    return path.join(descixDir, 'wallet.json');
  }

  /**
   * Get wallet file path from project root
   * Checks for .descix/wallet.json in current working directory
   */
  static getProjectWalletPath(projectRoot = process.cwd()) {
    return path.join(projectRoot, '.descix', 'wallet.json');
  }

  /**
   * Load wallet file from path
   * @param {string} walletPath - Path to wallet file
   * @returns {Promise<Object|null>} Wallet data or null if not found
   */
  static async loadWalletFile(walletPath) {
    try {
      const data = await fs.readFile(walletPath, 'utf-8');
      const walletData = JSON.parse(data);
      
      if (this.validateWalletFile(walletData)) {
        return walletData;
      } else {
        console.error('[WalletFile] Invalid wallet file structure');
        return null;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      console.error(`[WalletFile] Error loading wallet file: ${error.message}`);
      return null;
    }
  }

  /**
   * Save wallet file to path
   * @param {string} walletPath - Path to save wallet file
   * @param {Object} walletData - Wallet data to save
   * @returns {Promise<boolean>} Success status
   */
  static async saveWalletFile(walletPath, walletData) {
    try {
      // Validate before saving
      if (!this.validateWalletFile(walletData)) {
        throw new Error('Invalid wallet data structure');
      }

      // Ensure directory exists
      const dir = path.dirname(walletPath);
      await fs.mkdir(dir, { recursive: true });

      // Write file with restricted permissions (600)
      await fs.writeFile(walletPath, JSON.stringify(walletData, null, 2), { mode: 0o600 });
      
      return true;
    } catch (error) {
      console.error(`[WalletFile] Error saving wallet file: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate wallet file structure
   * @param {Object} walletData - Wallet data to validate
   * @returns {boolean} True if valid
   */
  static validateWalletFile(walletData) {
    if (!walletData || typeof walletData !== 'object') {
      return false;
    }

    // Required fields for authentication
    // Note: tokenSymbol and communityId are optional (may be absent in multi-community mode)
    const required = ['walletAddress', 'signature'];
    for (const field of required) {
      if (!walletData[field] || typeof walletData[field] !== 'string') {
        return false;
      }
    }

    // Validate wallet address format (basic check - should be hex string)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletData.walletAddress)) {
      return false;
    }

    return true;
  }

  /**
   * Check if session is expired
   * @param {Object} walletData - Wallet data with expiresAt field
   * @returns {boolean} True if expired or no expiresAt
   */
  static isSessionExpired(walletData) {
    if (!walletData || !walletData.expiresAt) {
      return true; // No expiration date means expired
    }

    try {
      const expiresAt = new Date(walletData.expiresAt);
      const now = new Date();
      return now >= expiresAt;
    } catch (error) {
      console.error('[WalletFile] Error parsing expiresAt:', error);
      return true; // Invalid date means expired
    }
  }

  /**
   * Check if wallet file has valid session token
   * @param {Object} walletData - Wallet data
   * @returns {boolean} True if has valid session
   */
  static hasValidSession(walletData) {
    if (!walletData) {
      return false;
    }

    // Check if session token exists
    if (!walletData.sessionToken || !walletData.userId) {
      return false;
    }

    // Check if session is expired
    if (this.isSessionExpired(walletData)) {
      return false;
    }

    return true;
  }

  /**
   * Get wallet path for a workspace root
   * Wallet is ALWAYS at {workspaceRoot}/.descix/wallet.json
   * 
   * @param {string} workspaceRoot - Workspace root directory
   * @returns {string} Path to wallet file
   */
  static getWalletPath(workspaceRoot) {
    return path.join(workspaceRoot, '.descix', 'wallet.json');
  }

  /**
   * Load wallet from workspace root
   * This is the primary method - wallet is always at {workspaceRoot}/.descix/wallet.json
   * 
   * @param {string} workspaceRoot - Workspace root directory
   * @returns {Promise<Object|null>} Wallet data or null if not found
   */
  static async loadFromWorkspace(workspaceRoot) {
    const walletPath = this.getWalletPath(workspaceRoot);
    return await this.loadWalletFile(walletPath);
  }

  /**
   * Save wallet to workspace root
   * 
   * @param {string} workspaceRoot - Workspace root directory
   * @param {Object} walletData - Wallet data to save
   * @returns {Promise<boolean>} Success status
   */
  static async saveToWorkspace(workspaceRoot, walletData) {
    const walletPath = this.getWalletPath(workspaceRoot);
    return await this.saveWalletFile(walletPath, walletData);
  }

  /**
   * @deprecated Use loadFromWorkspace() instead
   * Find wallet file - now just checks workspace root and home directory
   * @param {string} workspaceRoot - Workspace root directory (required)
   * @returns {Promise<string|null>} Path to wallet file or null if not found
   */
  static async findWalletFile(workspaceRoot = null) {
    // If workspace root provided, use it
    if (workspaceRoot) {
      const walletPath = this.getWalletPath(workspaceRoot);
      try {
        await fs.access(walletPath);
        return walletPath;
      } catch (error) {
        // Not found in workspace
      }
    }

    // Fallback to home directory (for initial setup before workspace exists)
    const homePath = this.getDefaultWalletPath();
    try {
      await fs.access(homePath);
      return homePath;
    } catch (error) {
      // Not found in home
    }

    return null;
  }

  /**
   * Create wallet file from wallet data
   * @param {Object} walletData - Wallet data { walletAddress, signature, tokenSymbol, communityId }
   * @param {string} preferredPath - Preferred path (optional, will use default if not provided)
   * @returns {Promise<string|null>} Path to saved wallet file or null on error
   */
  static async createWalletFile(walletData, preferredPath = null) {
    const walletPath = preferredPath || this.getDefaultWalletPath();
    const success = await this.saveWalletFile(walletPath, walletData);
    return success ? walletPath : null;
  }
}

export default WalletFileManager;

