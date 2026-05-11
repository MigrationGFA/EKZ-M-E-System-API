import { createHash } from 'node:crypto';

/** Hex SHA-256 digest of the given bytes. Used for tamper detection on
 *  evidence uploads per ADR 0005 §101. */
export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
