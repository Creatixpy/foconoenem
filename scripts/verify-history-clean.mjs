#!/usr/bin/env node

import { printFailures, verifyHistory } from './public-security.mjs';

try {
  const { failures, revisions, objects } = verifyHistory(process.cwd());
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
