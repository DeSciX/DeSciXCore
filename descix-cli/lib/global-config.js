/**
 * Global Configuration Manager
 * 
 * Manages ~/.descix/config.json for user-level settings.
 * This is separate from workspace-level config (workspace.json).
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';

const GLOBAL_CONFIG_DIR = '.descix';
const GLOBAL_CONFIG_FILE = 'config.json';

/**
 * Global Configuration Manager
 * Manages ~/.descix/config.json for user-level settings
 */
export class GlobalConfig {
  constructor(config = {}) {
    this.user_base_folder_id = config.user_base_folder_id || null;
    this.user_base_folder_name = config.user_base_folder_name || null;
    // NO default. An absent api_url means the global config names no origin, which is a fact
    // the origin owner knows how to report; substituting the production literal here made
    // ~/.descix/config.json claim an origin the user never set.
    this.api_url = config.api_url || null;
    this.environment = config.environment || 'production';
    this.registered_at = config.registered_at || null;
  }

  /**
   * Get global config directory path
   */
  static getConfigDir() {
    return path.join(os.homedir(), GLOBAL_CONFIG_DIR);
  }

  /**
   * Get global config file path
   */
  static getConfigPath() {
    return path.join(GlobalConfig.getConfigDir(), GLOBAL_CONFIG_FILE);
  }

  /**
   * Load global configuration
   * @returns {Promise<GlobalConfig>}
   */
  static async load() {
    try {
      const configPath = GlobalConfig.getConfigPath();
      const data = await fs.readFile(configPath, 'utf-8');
      return new GlobalConfig(JSON.parse(data));
    } catch (error) {
      // Return default config if not found
      return new GlobalConfig();
    }
  }

  /**
   * Save global configuration
   * @returns {Promise<string>} Path to saved config
   */
  async save() {
    const configDir = GlobalConfig.getConfigDir();
    await fs.mkdir(configDir, { recursive: true });
    
    const configPath = GlobalConfig.getConfigPath();
    const configData = {
      user_base_folder_id: this.user_base_folder_id,
      user_base_folder_name: this.user_base_folder_name,
      api_url: this.api_url,
      environment: this.environment,
      registered_at: this.registered_at
    };
    
    await fs.writeFile(configPath, JSON.stringify(configData, null, 2), 'utf-8');
    return configPath;
  }

  /**
   * Check if user has a base folder registered
   */
  hasBaseFolder() {
    return !!this.user_base_folder_id;
  }
}

export default GlobalConfig;
