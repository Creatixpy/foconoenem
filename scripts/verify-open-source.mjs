#!/usr/bin/env node

import { printFailures, verifyCurrentTree } from './public-security.mjs';

try {
  const { failures } = verifyCurrentTree(process.cwd());
  if (failures.length) {
    console.error('Open-source verification failed (index and working tree):');
    printFailures(failures);
    process.exitCode = 1;
  } else {
    console.log('Open-source verification passed for the index and working tree. Ignored files are never release inputs.');
  }
} catch {
  console.error('Open-source verification could not complete. No release is authorized.');
  process.exitCode = 1;
}
