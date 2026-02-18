# Git Merge Conflict Resolver

An intelligent automated Git merge conflict resolver that safely merges conflicts between base and feature branches following best practices.

## Features

- **Smart Conflict Detection**: Automatically detects the type of conflict (dependency, UI, import, type, config, or general)
- **Intelligent Merging Strategies**: Applies different resolution strategies based on conflict type
- **Preserves Intent**: Keeps new features from both branches when possible
- **No Manual Markers**: Outputs clean code without conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

## Resolution Strategies

### Dependencies
- Compares version numbers and selects the newer version
- Prefers feature branch if versions cannot be determined

### UI Changes
- Merges visual improvements from both branches
- Combines unique elements when both add different features
- Prefers the version with more complete changes

### Imports/Exports
- Combines all imports from both branches
- Removes duplicates and sorts alphabetically
- Maintains clean import organization

### Type Definitions
- Prefers extended type definitions that include more fields
- Defaults to feature branch types (likely needed for new features)

### Configuration Files
- Prefers feature branch configuration (intentional changes)

### Bug Fixes vs Features
- Detects bug fixes in base branch
- Combines bug fixes with feature changes when possible

### General Code
- Prefers feature branch for new features
- Preserves base branch for stability/core logic when needed

## Usage

### Command Line Interface

#### Interactive Mode
```bash
node scripts/merge-conflict-resolver.mjs
```

Follow the prompts to enter:
- File path
- Base branch name
- Feature branch name
- Conflict content (paste and press Ctrl+D)

#### Direct Arguments
```bash
node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch> <conflict-content>
```

Example:
```bash
node scripts/merge-conflict-resolver.mjs src/app.ts main feature "<<<<<<< HEAD
base code
=======
feature code
>>>>>>> feature"
```

#### Stdin Input
```bash
cat conflict.txt | node scripts/merge-conflict-resolver.mjs <file-path> <base-branch> <feature-branch>
```

Example:
```bash
cat conflict.txt | node scripts/merge-conflict-resolver.mjs package.json main feature-upgrade
```

#### Help
```bash
node scripts/merge-conflict-resolver.mjs --help
```

### TypeScript API

```typescript
import { resolveMergeConflict, resolveConflict, ConflictBlock } from './utils/mergeConflictResolver';

// Simple API
const result = resolveMergeConflict(
  'src/app.ts',
  'main',
  'feature-branch',
  conflictContent
);
console.log(result);

// Advanced API
const conflict: ConflictBlock = {
  filePath: 'src/app.ts',
  baseBranch: 'main',
  featureBranch: 'feature-branch',
  conflictContent: '<<<<<<< HEAD\nbase\n=======\nfeature\n>>>>>>> feature'
};

const resolved = resolveConflict(conflict);
console.log(resolved.resolvedContent);
console.log(resolved.strategy);
console.log(resolved.explanation);
```

## Examples

### Dependency Conflict
```bash
# Input conflict
<<<<<<< HEAD
"react": "^18.2.0"
=======
"react": "^19.2.4"
>>>>>>> feature-upgrade-react

# Resolution
"react": "^19.2.4"
Strategy: dependency-newer
Explanation: Chose feature version 19.2.4 over base version 18.2.0 (newer)
```

### Import Conflict
```bash
# Input conflict
<<<<<<< HEAD
import React from 'react';
import { useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
import { useRouter } from 'react-router-dom';
>>>>>>> feature-add-router

# Resolution
import React from 'react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'react-router-dom';
import { useState } from 'react';
Strategy: import-combine
Explanation: Combined imports from both branches (deduplicated and sorted)
```

### Type Conflict
```bash
# Input conflict
<<<<<<< HEAD
interface User {
  id: string;
  name: string;
}
=======
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
>>>>>>> feature-add-fields

# Resolution
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
Strategy: type-extended
Explanation: Feature version extends base type definition
```

## Best Practices

1. **Review Output**: Always review the resolved code before committing
2. **Test Changes**: Run tests after resolving conflicts to ensure nothing breaks
3. **Understand Context**: The resolver uses heuristics - understand what changed in both branches
4. **Manual Override**: For complex logic conflicts, manual resolution may be better
5. **Incremental Resolution**: Resolve conflicts one file at a time for easier review

## Limitations

- Cannot resolve semantic conflicts (e.g., renamed functions called differently)
- May not detect all bug fixes vs. features
- Complex refactors may need manual review
- Works best with clean, well-structured code

## Safety Features

- Never removes working code unless absolutely necessary
- Preserves both versions when intent is unclear
- Provides explanation for every resolution
- Compatible with existing Git workflows

## Integration

The merge conflict resolver can be integrated into:
- Git hooks (pre-merge)
- CI/CD pipelines
- Code review tools
- IDE plugins
- Automated merge workflows

## Contributing

When adding new conflict detection or resolution strategies:
1. Add detection logic in `detectConflictType()`
2. Add resolution strategy in `mergeVersions()`
3. Test with real-world examples
4. Document the new strategy in this README
