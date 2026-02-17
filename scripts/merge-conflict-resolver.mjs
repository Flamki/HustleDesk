#!/usr/bin/env node

/**
 * Git Merge Conflict Resolver CLI
 * 
 * Usage:
 *   node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch> <conflict-content>
 *   
 * Or with conflict content from stdin:
 *   cat conflict.txt | node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch>
 * 
 * Or interactive mode:
 *   node scripts/merge-conflict-resolver.mjs
 */

import { readFileSync } from 'fs';
import { createInterface } from 'readline';

// Dynamic import of TypeScript module (in dev, this would be transpiled)
// For production, we'll implement the resolver logic directly in JS

/**
 * Parse a Git conflict block into its component parts
 */
function parseConflictBlock(conflictContent) {
  const lines = conflictContent.split('\n');
  let baseVersion = '';
  let featureVersion = '';
  let ancestorVersion;
  let section = 'none';

  for (const line of lines) {
    if (line.startsWith('<<<<<<<')) {
      section = 'base';
      continue;
    } else if (line.startsWith('|||||||')) {
      section = 'ancestor';
      ancestorVersion = '';
      continue;
    } else if (line.startsWith('=======')) {
      section = 'feature';
      continue;
    } else if (line.startsWith('>>>>>>>')) {
      section = 'none';
      continue;
    }

    if (section === 'base') {
      baseVersion += (baseVersion ? '\n' : '') + line;
    } else if (section === 'ancestor') {
      ancestorVersion = (ancestorVersion || '') + (ancestorVersion ? '\n' : '') + line;
    } else if (section === 'feature') {
      featureVersion += (featureVersion ? '\n' : '') + line;
    }
  }

  return {
    baseVersion: baseVersion.trim(),
    featureVersion: featureVersion.trim(),
    ancestorVersion: ancestorVersion?.trim(),
  };
}

/**
 * Detect the type of conflict based on content analysis
 */
function detectConflictType(filePath, baseVersion, featureVersion) {
  if (
    filePath.includes('package.json') ||
    filePath.includes('package-lock.json') ||
    filePath.includes('yarn.lock') ||
    filePath.includes('pnpm-lock.yaml') ||
    filePath.includes('requirements.txt') ||
    filePath.includes('Gemfile.lock') ||
    filePath.includes('go.mod')
  ) {
    return 'dependency';
  }

  if (
    filePath.endsWith('.css') ||
    filePath.endsWith('.scss') ||
    filePath.endsWith('.jsx') ||
    filePath.endsWith('.tsx') ||
    filePath.includes('component') ||
    filePath.includes('Component')
  ) {
    const hasUIKeywords = (content) =>
      /className|style|css|render|return \(|<div|<span|<button/i.test(content);
    if (hasUIKeywords(baseVersion) || hasUIKeywords(featureVersion)) {
      return 'ui';
    }
  }

  if (
    baseVersion.includes('import ') ||
    baseVersion.includes('export ') ||
    featureVersion.includes('import ') ||
    featureVersion.includes('export ')
  ) {
    return 'import';
  }

  if (
    baseVersion.includes('interface ') ||
    baseVersion.includes('type ') ||
    featureVersion.includes('interface ') ||
    featureVersion.includes('type ')
  ) {
    return 'type';
  }

  if (
    filePath.endsWith('.json') ||
    filePath.endsWith('.yaml') ||
    filePath.endsWith('.yml') ||
    filePath.endsWith('.toml') ||
    filePath.endsWith('.config.js') ||
    filePath.endsWith('.config.ts')
  ) {
    return 'config';
  }

  return 'general';
}

/**
 * Merge two versions of code intelligently
 */
function mergeVersions(baseVersion, featureVersion, conflictType) {
  if (!baseVersion && featureVersion) {
    return {
      merged: featureVersion,
      strategy: 'feature-only',
      explanation: 'Base version was empty, kept feature version',
    };
  }
  if (baseVersion && !featureVersion) {
    return {
      merged: baseVersion,
      strategy: 'base-only',
      explanation: 'Feature version was empty, kept base version',
    };
  }

  if (baseVersion === featureVersion) {
    return {
      merged: baseVersion,
      strategy: 'identical',
      explanation: 'Both versions were identical',
    };
  }

  if (conflictType === 'dependency') {
    const baseVersionMatch = baseVersion.match(/["']?\d+\.\d+\.\d+["']?/);
    const featureVersionMatch = featureVersion.match(/["']?\d+\.\d+\.\d+["']?/);

    if (baseVersionMatch && featureVersionMatch) {
      const baseVer = baseVersionMatch[0].replace(/["']/g, '');
      const featureVer = featureVersionMatch[0].replace(/["']/g, '');
      const baseParts = baseVer.split('.').map(Number);
      const featureParts = featureVer.split('.').map(Number);

      for (let i = 0; i < 3; i++) {
        if (featureParts[i] > baseParts[i]) {
          return {
            merged: featureVersion,
            strategy: 'dependency-newer',
            explanation: `Chose feature version ${featureVer} over base version ${baseVer} (newer)`,
          };
        } else if (baseParts[i] > featureParts[i]) {
          return {
            merged: baseVersion,
            strategy: 'dependency-newer',
            explanation: `Chose base version ${baseVer} over feature version ${featureVer} (newer)`,
          };
        }
      }
    }

    return {
      merged: featureVersion,
      strategy: 'dependency-prefer-feature',
      explanation: 'Could not determine versions, kept feature branch dependency',
    };
  }

  if (conflictType === 'ui') {
    if (featureVersion.includes(baseVersion)) {
      return {
        merged: featureVersion,
        strategy: 'ui-additive',
        explanation: 'Feature version includes all base changes plus additions',
      };
    }
    if (baseVersion.includes(featureVersion)) {
      return {
        merged: baseVersion,
        strategy: 'ui-additive',
        explanation: 'Base version includes all feature changes plus additions',
      };
    }

    const baseLines = baseVersion.split('\n');
    const featureLines = featureVersion.split('\n');
    const merged = [...new Set([...baseLines, ...featureLines])].join('\n');

    return {
      merged,
      strategy: 'ui-merge-both',
      explanation: 'Merged UI changes from both branches (combined unique elements)',
    };
  }

  if (conflictType === 'import') {
    const baseImports = baseVersion.split('\n').filter((l) => l.trim());
    const featureImports = featureVersion.split('\n').filter((l) => l.trim());
    const allImports = [...new Set([...baseImports, ...featureImports])];
    const merged = allImports.sort().join('\n');

    return {
      merged,
      strategy: 'import-combine',
      explanation: 'Combined imports from both branches (deduplicated and sorted)',
    };
  }

  if (conflictType === 'type') {
    if (featureVersion.includes(baseVersion) && featureVersion.length > baseVersion.length) {
      return {
        merged: featureVersion,
        strategy: 'type-extended',
        explanation: 'Feature version extends base type definition',
      };
    }
    if (baseVersion.includes(featureVersion) && baseVersion.length > featureVersion.length) {
      return {
        merged: baseVersion,
        strategy: 'type-extended',
        explanation: 'Base version extends feature type definition',
      };
    }

    return {
      merged: featureVersion,
      strategy: 'type-prefer-feature',
      explanation: 'Preferred feature branch type definition (likely needed for new features)',
    };
  }

  if (conflictType === 'config') {
    return {
      merged: featureVersion,
      strategy: 'config-prefer-feature',
      explanation: 'Preferred feature branch configuration (intentional change)',
    };
  }

  const isBugFix = (content) => /fix|bug|issue|error|correct/i.test(content);

  if (isBugFix(baseVersion) && !isBugFix(featureVersion)) {
    return {
      merged: baseVersion + '\n' + featureVersion,
      strategy: 'general-bugfix-plus-feature',
      explanation: 'Combined bug fix from base with feature changes',
    };
  }

  return {
    merged: featureVersion,
    strategy: 'general-prefer-feature',
    explanation: 'Preferred feature branch (default strategy for new features)',
  };
}

/**
 * Resolve a Git merge conflict intelligently
 */
function resolveConflict(filePath, baseBranch, featureBranch, conflictContent) {
  const parsed = parseConflictBlock(conflictContent);
  const conflictType = detectConflictType(filePath, parsed.baseVersion, parsed.featureVersion);
  const result = mergeVersions(parsed.baseVersion, parsed.featureVersion, conflictType);

  return {
    filePath,
    resolvedContent: result.merged,
    strategy: result.strategy,
    explanation: result.explanation,
  };
}

/**
 * Format the resolved content for output
 */
function formatResolvedContent(resolved) {
  return `FINAL MERGED CODE:
\`\`\`
${resolved.resolvedContent}
\`\`\`

Strategy: ${resolved.strategy}
Explanation: ${resolved.explanation}`;
}

/**
 * Read from stdin
 */
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Interactive mode - prompt for input
 */
async function interactiveMode() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, resolve);
    });

  console.log('🔀 Git Merge Conflict Resolver - Interactive Mode\n');

  const filePath = await question('File path: ');
  const baseBranch = await question('Base branch name (e.g., main): ');
  const featureBranch = await question('Feature branch name: ');

  console.log('\nPaste the conflict content (including conflict markers) and press Ctrl+D when done:');

  rl.close();

  const conflictContent = await readStdin();

  if (!conflictContent.trim()) {
    console.error('❌ Error: No conflict content provided');
    process.exit(1);
  }

  const resolved = resolveConflict(filePath, baseBranch, featureBranch, conflictContent);
  console.log('\n' + formatResolvedContent(resolved));
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Interactive mode
  if (args.length === 0) {
    await interactiveMode();
    return;
  }

  // Check for help flag
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Git Merge Conflict Resolver

Usage:
  node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch> <conflict-content>
  
  Or with conflict content from stdin:
  cat conflict.txt | node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch>
  
  Or interactive mode:
  node scripts/merge-conflict-resolver.mjs

Arguments:
  file-path        Path to the file with conflict
  base-branch      Name of the base branch (e.g., main)
  feature-branch   Name of the feature branch
  conflict-content Git conflict block (optional if using stdin)

Examples:
  # With conflict content as argument
  node scripts/merge-conflict-resolver.mjs src/app.ts main feature "<<<<<<< HEAD\\nbase code\\n=======\\nfeature code\\n>>>>>>> feature"

  # With conflict content from stdin
  cat conflict.txt | node scripts/merge-conflict-resolver.mjs src/app.ts main feature

  # Interactive mode
  node scripts/merge-conflict-resolver.mjs
`);
    return;
  }

  // Command line arguments mode
  if (args.length < 3) {
    console.error('❌ Error: Missing required arguments');
    console.error('Usage: node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch> [conflict-content]');
    console.error('Use --help for more information');
    process.exit(1);
  }

  const [filePath, baseBranch, featureBranch, ...conflictContentArgs] = args;

  let conflictContent;
  if (conflictContentArgs.length > 0) {
    conflictContent = conflictContentArgs.join(' ');
  } else if (!process.stdin.isTTY) {
    conflictContent = await readStdin();
  } else {
    console.error('❌ Error: No conflict content provided');
    console.error('Provide conflict content as an argument or via stdin');
    process.exit(1);
  }

  if (!conflictContent.trim()) {
    console.error('❌ Error: Conflict content is empty');
    process.exit(1);
  }

  const resolved = resolveConflict(filePath, baseBranch, featureBranch, conflictContent);
  console.log(formatResolvedContent(resolved));
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
