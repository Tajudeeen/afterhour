// Loads environment variables before any other module imports config.
// The monorepo keeps .env at the repo root, but `pnpm --filter @afterhours/api dev`
// runs with cwd = apps/api, so dotenv's default lookup would miss it. Resolve
// the root .env explicitly (apps/api/src -> repo root) regardless of cwd.
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

// Fast signature verification retries in test mode so tests don't wait for
// real RPC backoff when verifying test/mock signatures.
if (process.env.NODE_ENV !== 'production') {
  process.env.VERIFY_RETRIES = process.env.VERIFY_RETRIES ?? '0';
  process.env.VERIFY_RETRY_DELAY_MS = process.env.VERIFY_RETRY_DELAY_MS ?? '0';
}
