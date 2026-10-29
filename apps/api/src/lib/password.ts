import crypto from "node:crypto";
import { argon2id, argon2Verify } from "hash-wasm";

// OWASP-recommended argon2id settings
export function hashPassword(password: string): Promise<string> {
  return argon2id({
    password,
    salt: crypto.randomBytes(16),
    memorySize: 19456, // KiB
    iterations: 2,
    parallelism: 1,
    hashLength: 32,
    outputType: "encoded", //
  });
}

export function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  return argon2Verify({ password, hash });
}
