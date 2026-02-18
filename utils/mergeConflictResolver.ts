/**
 * Git Merge Conflict Resolver
 * 
 * Automatically resolves merge conflicts between base and feature branches
 * following best practices and intelligent merging strategies.
 */

export interface ConflictBlock {
  filePath: string;
  baseBranch: string;
  featureBranch: string;
  conflictContent: string;
}

export interface ResolvedConflict {
  filePath: string;
  resolvedContent: string;
  strategy: string;
  explanation: string;
}

interface ParsedConflict {
  baseVersion: string;
  featureVersion: string;
  ancestorVersion?: string;
}

/**
 * Parse a Git conflict block into its component parts
 */
function parseConflictBlock(conflictContent: string): ParsedConflict {
  const lines = conflictContent.split('\n');
  let baseVersion = '';
  let featureVersion = '';
  let ancestorVersion: string | undefined;
  let section: 'base' | 'ancestor' | 'feature' | 'none' = 'none';

  for (const line of lines) {
    // Handle conflict markers
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

    // Add content to appropriate section
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
function detectConflictType(
  filePath: string,
  baseVersion: string,
  featureVersion: string
): string {
  // Check for dependency/version conflicts
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

  // Check for UI-related conflicts
  if (
    filePath.endsWith('.css') ||
    filePath.endsWith('.scss') ||
    filePath.endsWith('.jsx') ||
    filePath.endsWith('.tsx') ||
    filePath.includes('component') ||
    filePath.includes('Component')
  ) {
    const hasUIKeywords = (content: string) =>
      /className|style|css|render|return \(|<div|<span|<button/i.test(content);
    if (hasUIKeywords(baseVersion) || hasUIKeywords(featureVersion)) {
      return 'ui';
    }
  }

  // Check for type/interface changes (check before import/export to handle "export interface")
  if (
    baseVersion.includes('interface ') ||
    baseVersion.includes('type ') ||
    featureVersion.includes('interface ') ||
    featureVersion.includes('type ')
  ) {
    return 'type';
  }

  // Check for import/export changes
  if (
    baseVersion.includes('import ') ||
    baseVersion.includes('export ') ||
    featureVersion.includes('import ') ||
    featureVersion.includes('export ')
  ) {
    return 'import';
  }

  // Check for configuration changes
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
function mergeVersions(
  baseVersion: string,
  featureVersion: string,
  conflictType: string
): { merged: string; strategy: string; explanation: string } {
  // Handle empty versions
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

  // Handle identical content (shouldn't happen but be safe)
  if (baseVersion === featureVersion) {
    return {
      merged: baseVersion,
      strategy: 'identical',
      explanation: 'Both versions were identical',
    };
  }

  // Handle dependencies - prefer newer version
  if (conflictType === 'dependency') {
    // Try to detect version numbers and pick the higher one
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

    // If we can't determine version, prefer feature (more likely to be the intentional change)
    return {
      merged: featureVersion,
      strategy: 'dependency-prefer-feature',
      explanation: 'Could not determine versions, kept feature branch dependency',
    };
  }

  // Handle UI - try to merge both improvements
  if (conflictType === 'ui') {
    // Check if one is a clear addition to the other
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

    // Try to merge by combining unique lines
    const baseLines = baseVersion.split('\n');
    const featureLines = featureVersion.split('\n');
    const uniqueLines = new Set([...baseLines, ...featureLines]);
    const merged = Array.from(uniqueLines).join('\n');

    return {
      merged,
      strategy: 'ui-merge-both',
      explanation: 'Merged UI changes from both branches (combined unique elements)',
    };
  }

  // Handle imports - combine both sets
  if (conflictType === 'import') {
    const baseImports = baseVersion.split('\n').filter((l) => l.trim());
    const featureImports = featureVersion.split('\n').filter((l) => l.trim());
    const uniqueImports = new Set([...baseImports, ...featureImports]);
    const allImports = Array.from(uniqueImports);
    const merged = allImports.sort().join('\n');

    return {
      merged,
      strategy: 'import-combine',
      explanation: 'Combined imports from both branches (deduplicated and sorted)',
    };
  }

  // Handle types - try to merge definitions
  if (conflictType === 'type') {
    // If one version adds fields to the other, prefer the one with more fields
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

    // Default to feature for type changes (new features often need new types)
    return {
      merged: featureVersion,
      strategy: 'type-prefer-feature',
      explanation: 'Preferred feature branch type definition (likely needed for new features)',
    };
  }

  // Handle configuration - prefer feature branch
  if (conflictType === 'config') {
    return {
      merged: featureVersion,
      strategy: 'config-prefer-feature',
      explanation: 'Preferred feature branch configuration (intentional change)',
    };
  }

  // General case - prefer feature branch for new features
  // but try to detect if base is a bug fix
  const isBugFix = (content: string) => /fix|bug|issue|error|correct/i.test(content);

  if (isBugFix(baseVersion) && !isBugFix(featureVersion)) {
    // Base appears to be a bug fix, try to keep both
    return {
      merged: baseVersion + '\n' + featureVersion,
      strategy: 'general-bugfix-plus-feature',
      explanation: 'Combined bug fix from base with feature changes',
    };
  }

  // Default: prefer feature branch
  return {
    merged: featureVersion,
    strategy: 'general-prefer-feature',
    explanation: 'Preferred feature branch (default strategy for new features)',
  };
}

/**
 * Resolve a Git merge conflict intelligently
 */
export function resolveConflict(conflict: ConflictBlock): ResolvedConflict {
  // Parse the conflict block
  const parsed = parseConflictBlock(conflict.conflictContent);

  // Detect conflict type
  const conflictType = detectConflictType(
    conflict.filePath,
    parsed.baseVersion,
    parsed.featureVersion
  );

  // Merge the versions
  const result = mergeVersions(parsed.baseVersion, parsed.featureVersion, conflictType);

  return {
    filePath: conflict.filePath,
    resolvedContent: result.merged,
    strategy: result.strategy,
    explanation: result.explanation,
  };
}

/**
 * Format the resolved content for output
 */
export function formatResolvedContent(resolved: ResolvedConflict): string {
  return `FINAL MERGED CODE:
\`\`\`
${resolved.resolvedContent}
\`\`\`

Strategy: ${resolved.strategy}
Explanation: ${resolved.explanation}`;
}

/**
 * Main entry point for resolving conflicts from command line or API
 */
export function resolveMergeConflict(
  filePath: string,
  baseBranch: string,
  featureBranch: string,
  conflictContent: string
): string {
  const conflict: ConflictBlock = {
    filePath,
    baseBranch,
    featureBranch,
    conflictContent,
  };

  const resolved = resolveConflict(conflict);
  return formatResolvedContent(resolved);
}
