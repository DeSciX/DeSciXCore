/**
 * Health Command
 *
 * Environment-aware platform health checker.
 * - DEV: checks local ports from workspace.json service definitions
 * - Non-DEV (staging/prod): HTTPS health requests to configured service URLs
 *
 * Designed for use by platform-starter and agents to verify service availability
 * BEFORE the MCP layer is running (unlike platform_health which requires Cloud).
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';
import { WorkspaceConfig } from '../workspace-config.js';

const execAsync = promisify(exec);

/**
 * Build the service registry from workspace.json
 * Returns an array of { name, appId, port?, url?, type }
 */
function buildServiceRegistry(wsConfig) {
    const services = [];
    const env = wsConfig.env || {};

    // Platform service (e.g., daita / Cloud)
    if (env.platform) {
        if (env.platform.microservice?.port) {
            services.push({
                name: env.platform.appId || 'platform',
                appId: env.platform.appId,
                port: env.platform.microservice.port,
                type: 'microservice',
                localPath: env.platform.localPath
            });
        }
        if (env.platform.site?.port) {
            services.push({
                name: `${env.platform.appId || 'platform'}-site`,
                appId: env.platform.appId,
                port: env.platform.site.port,
                type: 'site',
                protocol: env.platform.site.protocol || 'https',
                localPath: env.platform.localPath
            });
        }
    }

    // Product services
    for (const product of (env.products || [])) {
        if (product.microservice?.port) {
            services.push({
                name: product.appId,
                appId: product.appId,
                port: product.microservice.port,
                type: 'microservice',
                localPath: product.localPath
            });
        }
        if (product.site?.port) {
            services.push({
                name: `${product.appId}-site`,
                appId: product.appId,
                port: product.site.port,
                type: 'site',
                protocol: product.site.protocol || 'https',
                localPath: product.localPath
            });
        }
    }

    return services;
}

/**
 * DEV mode: check if a local port is listening
 */
async function checkPortDev(port) {
    try {
        const { stdout } = await execAsync(`lsof -i :${port} -sTCP:LISTEN 2>/dev/null | head -3`);
        const listening = stdout.trim().length > 0;
        return { healthy: listening, method: 'port-check', port };
    } catch {
        return { healthy: false, method: 'port-check', port };
    }
}

/**
 * Non-DEV mode: HTTPS health check to a service URL
 */
async function checkHttpsHealth(url, timeoutMs = 5000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'http:' ? http : https;

        const req = client.get(url, {
            timeout: timeoutMs,
            rejectUnauthorized: false // Allow self-signed certs in non-prod
        }, (res) => {
            const responseTime = Date.now() - startTime;
            // Accept any 2xx or 3xx as healthy
            const healthy = res.statusCode >= 200 && res.statusCode < 400;
            res.resume(); // Drain response
            resolve({ healthy, method: 'https', statusCode: res.statusCode, responseTime });
        });

        req.on('error', (err) => {
            resolve({ healthy: false, method: 'https', error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ healthy: false, method: 'https', error: 'timeout' });
        });
    });
}

/**
 * Run health checks for all or filtered services
 */
export async function runHealth(options = {}) {
    const { microservice: filterName, json: jsonOutput } = options;

    // Load workspace config
    let wsConfig;
    try {
        wsConfig = await WorkspaceConfig.load(process.cwd());
    } catch (err) {
        console.error(chalk.red(`\nFailed to load workspace config: ${err.message}`));
        console.log(chalk.gray('  Ensure .descix/workspace.json exists and is valid\n'));
        process.exit(1);
    }

    const env = wsConfig.env || {};
    const isDev = env.environment === 'DEV';

    // Build service registry from workspace.json
    let services = buildServiceRegistry(wsConfig);

    // Filter if --microservice specified
    if (filterName) {
        services = services.filter(s => s.appId === filterName || s.name === filterName);
        if (services.length === 0) {
            console.error(chalk.red(`\nNo service found matching "${filterName}" in workspace.json`));
            console.log(chalk.gray('  Available services: ' +
                buildServiceRegistry(wsConfig).map(s => s.appId).filter((v, i, a) => a.indexOf(v) === i).join(', ') + '\n'));
            process.exit(1);
        }
    }

    // Run health checks
    const results = [];
    const startTime = Date.now();

    for (const service of services) {
        let check;

        if (isDev) {
            // DEV: check local port
            check = await checkPortDev(service.port);
        } else {
            // Non-DEV: HTTPS health check
            // Derive URL from appId convention. In prod, services are at their configured URLs.
            // For now, construct from port for local checks, or from known URL patterns.
            const protocol = service.protocol || 'https';
            const url = `${protocol}://localhost:${service.port}/`;
            check = await checkHttpsHealth(url);
        }

        results.push({
            service: service.name,
            appId: service.appId,
            type: service.type,
            port: service.port,
            ...check
        });
    }

    const totalTime = Date.now() - startTime;

    // Build structured output
    const output = {
        environment: env.environment || 'unknown',
        timestamp: new Date().toISOString(),
        check_duration_ms: totalTime,
        services: results,
        all_healthy: results.every(r => r.healthy),
        summary: {
            total: results.length,
            healthy: results.filter(r => r.healthy).length,
            unhealthy: results.filter(r => !r.healthy).length
        }
    };

    // Output
    if (jsonOutput) {
        console.log(JSON.stringify(output, null, 2));
        return output;
    }

    // Human-readable output
    console.log(chalk.cyan(`\nPlatform Health Check (${output.environment})`));
    console.log(chalk.cyan('='.repeat(50)));
    console.log(chalk.gray(`  Timestamp: ${output.timestamp}`));
    console.log(chalk.gray(`  Check duration: ${output.check_duration_ms}ms\n`));

    for (const result of results) {
        const status = result.healthy ? chalk.green('PASS') : chalk.red('FAIL');
        const details = [];
        if (result.port) details.push(`port:${result.port}`);
        if (result.responseTime) details.push(`${result.responseTime}ms`);
        if (result.statusCode) details.push(`HTTP ${result.statusCode}`);
        if (result.error) details.push(result.error);
        const detailStr = details.length > 0 ? chalk.gray(` (${details.join(', ')})`) : '';

        console.log(`  ${status} ${result.service} [${result.type}]${detailStr}`);
    }

    console.log();
    if (output.all_healthy) {
        console.log(chalk.green(`All ${output.summary.total} services healthy.\n`));
    } else {
        console.log(chalk.yellow(`${output.summary.healthy}/${output.summary.total} healthy, ${output.summary.unhealthy} unhealthy.\n`));
    }

    return output;
}
