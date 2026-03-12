/**
 * DeSciX CLI Clone Command
 *
 * Clones a DeSciX app repository using platform-provided deploy key credentials.
 * Fetches credentials via get_repo_credentials (HTTP-only, no direct service imports).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Clone a DeSciX app repository using platform-provided deploy key.
 * @param {Object} apiClient - DeSciXApiClient instance
 * @param {Object} options - { app_id, targetPath }
 */
export async function runClone(apiClient, options) {
    const { app_id, targetPath } = options;

    // 1. Get repo credentials from platform
    console.log(`Fetching repository credentials for ${app_id}...`);
    const creds = await apiClient.invoke('get_repo_credentials', { app_id });

    if (!creds.repo_url || !creds.ssh_private_key) {
        throw new Error('No repository linked to this app.');
    }

    // 2. Write SSH key to temp file
    const tmpKeyPath = path.join(os.tmpdir(), `descix_clone_key_${Date.now()}`);
    const clonePath = targetPath || path.basename(creds.repo_url, '.git');

    try {
        fs.writeFileSync(tmpKeyPath, creds.ssh_private_key, { mode: 0o600 });

        // 3. Git clone with deploy key
        const sshCommand = `ssh -i ${tmpKeyPath} -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes`;
        const branch = creds.branch || 'main';

        console.log(`Cloning ${creds.repo_url} (branch: ${branch})...`);
        execSync(
            `git clone -b ${branch} ${creds.repo_url} ${clonePath}`,
            {
                env: { ...process.env, GIT_SSH_COMMAND: sshCommand },
                stdio: 'inherit'
            }
        );

        // 4. Persist deploy key for future pulls
        const descixDir = path.join(clonePath, '.descix');
        if (!fs.existsSync(descixDir)) {
            fs.mkdirSync(descixDir, { recursive: true });
        }
        fs.writeFileSync(path.join(descixDir, 'repo_key'), creds.ssh_private_key, { mode: 0o600 });

        // 5. Ensure .gitignore covers sensitive files
        const gitignorePath = path.join(clonePath, '.gitignore');
        const gitignoreEntries = ['.descix/wallet.json', '.descix/repo_key'];
        let gitignoreContent = '';
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        }
        const missing = gitignoreEntries.filter(e => !gitignoreContent.includes(e));
        if (missing.length > 0) {
            fs.appendFileSync(gitignorePath, '\n# DeSciX credentials (do not commit)\n' + missing.join('\n') + '\n');
        }

        // 6. Write app.json seed file
        const appJson = {
            version: '1.0',
            app_id,
            community_id: null, // will be resolved by agent via doctor
            has_repo: true,
            kb_ready: false // conservative — agent will check via doctor
        };
        fs.writeFileSync(path.join(descixDir, 'app.json'), JSON.stringify(appJson, null, 2));

        console.log(`\nCloned to ${clonePath}/`);
        console.log(`Deploy key saved to ${clonePath}/.descix/repo_key`);
        if (creds.subfolder) {
            console.log(`\nNote: App source is in subfolder: ${creds.subfolder}`);
        }
        console.log('\nNext: open this folder in VS Code with the DeSciX extension.');

    } finally {
        // Clean up temp key
        try { fs.unlinkSync(tmpKeyPath); } catch (e) { /* ignore */ }
    }
}

export default { runClone };
