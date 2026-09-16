#!/usr/bin/env node
/**
 * Regenerate DeSciX/V2_docs/architecture/platform-must-know-briefer.md from live code, gcloud and
 * Firestore. A platform-checkout tool: it reads the platform repositories and needs operator
 * credentials, so it ships in no package.
 *
 *   node scripts/briefer/run.mjs [--env dev|demo|prod] [--out PATH] [--check] [-v]
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { runBriefer } from './index.js';

const program = new Command('briefer')
  .description('Regenerate platform-must-know-briefer.md from live code + gcloud + Firestore (HARD-FAIL on drift)')
  .option('--env <name>', 'Target environment: dev|demo|prod', 'dev')
  .option('--out <path>', 'Override output path (default: workspace-root/DeSciX/V2_docs/architecture/platform-must-know-briefer.md)')
  .option('--check', 'Drift-detection mode: regen to memory, diff against canonical, non-zero exit on drift')
  .option('-v, --verbose', 'Print per-source paths, citations, and timings')
  .action(async (options) => {
    try {
      await runBriefer(options);
    } catch (error) {
      console.error(chalk.red(`\n❌ Briefer failed: ${error.message}\n`));
      process.exit(1);
    }
  });

await program.parseAsync(process.argv);
