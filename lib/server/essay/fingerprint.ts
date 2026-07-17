import { createHash } from 'node:crypto';

export function createEssayInputFingerprint(input: {
  essay: string;
  theme: { mode: 'generated'; id: string } | { mode: 'manual'; tema: string };
}): string {
  return createHash('sha256')
    .update(JSON.stringify({ essay: input.essay.trim(), theme: input.theme }))
    .digest('hex');
}
