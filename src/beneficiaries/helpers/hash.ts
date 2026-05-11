import { createHash } from 'node:crypto';

/**
 * SHA-256 hash of `salt || raw` for National Identification Number storage.
 * Per ADR 0006: we never persist the raw NIN; the hash is used only for
 * duplicate detection and authoritative match-back to NIMC.
 *
 * Rotating BENEFICIARY_HASH_SALT invalidates duplicate detection — only
 * rotate during a planned re-keying exercise.
 */
function getHashSalt(): string {
  const value = process.env.BENEFICIARY_HASH_SALT;
  if (!value || value.length === 0) {
    throw new Error(
      'BENEFICIARY_HASH_SALT is not set. Configure it in your environment before registering beneficiaries.',
    );
  }
  return value;
}

export function hashNin(raw: string): string {
  const salt = getHashSalt();
  return createHash('sha256')
    .update(salt + raw)
    .digest('hex');
}
