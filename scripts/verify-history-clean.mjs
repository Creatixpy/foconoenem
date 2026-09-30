#!/usr/bin/env node

import fs from 'node:fs';
import { parsePushUpdates, printFailures, verifyHistory } from './public-security.mjs';

try {
  if (process.argv.slice(2).some((argument) => argument !== '--pre-push')) throw new Error('invalid_arguments');
  const updates = process.argv.includes('--pre-push') ? parsePushUpdates(fs.readFileSync(0, 'utf8')) : { revisions: [], failures: [] };
  const result = verifyHistory(process.cwd(), { additionalRevisions: updates.revisions });
  const failures = [...updates.failures, ...result.failures];
  const { revisions, objects } = result;
  if (failures.length) {
    console.error('Git history verification failed:');
    printFailures(failures);
    console.error('Credential values are suppressed. Rotate exposed credentials and sanitize every public ref before publication.');
    process.exitCode = 1;
  } else {
    console.log(`Git history verification passed (${revisions} revisions, ${objects} unique reachable objects).`);
  }
} catch {
  console.error('Git history verification could not complete. No publication is authorized.');
  process.exitCode = 1;
}
