/**
 * AfterHours environment configuration loader.
 *
 * Reads from process.env with safe defaults. No .env file is committed;
 * the consumer is expected to load dotenv (or the platform's secret manager)
 * before importing this module. Every value here is either non-secret
 * (RPC URL, etc.) or a reference to a secret that must NOT be logged.
 */
import { SOLANA_CHAIN_ID, SOLANA_LOCALNET_RPC_URL } from './solana.js';

export interface SolanaConfig {
  rpcUrl: string;
  chainId: number;
}

export interface Config {
  solana: SolanaConfig;
  apiPort: number;
  webApiUrl: string;
  /** OpenAI / LLM API key for the AI Analyst. Never expose as NEXT_PUBLIC_*. */
  llmApiKey: string | null;
  llmModel: string;
}

function opt(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function intOpt(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (
    (raw !== undefined && !/^\d+$/u.test(raw)) ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(`Environment variable ${name} must be an integer from ${min} to ${max}`);
  }
  return value;
}

export function loadConfig(): Config {
  return {
    solana: {
      rpcUrl: opt('SOLANA_RPC_URL', SOLANA_LOCALNET_RPC_URL),
      chainId: intOpt('SOLANA_CHAIN_ID', SOLANA_CHAIN_ID, 1, Number.MAX_SAFE_INTEGER),
    },
    apiPort: intOpt('API_PORT', 8787, 1, 65_535),
    webApiUrl: opt('NEXT_PUBLIC_API_URL', 'http://localhost:8787'),
    llmApiKey: process.env.OPENAI_API_KEY ?? null,
    llmModel: opt('LLM_MODEL', 'gpt-4o-mini'),
  };
}

let cached: Config | null = null;

/** Load config once and memoize. Call `reloadConfig()` in tests if needed. */
export function getConfig(): Config {
  if (!cached) cached = loadConfig();
  return cached;
}

export function reloadConfig(): Config {
  cached = loadConfig();
  return cached;
}

export {
  SOLANA_LOCALNET_RPC_URL,
  SOLANA_MAINNET_RPC_URL,
  SOLANA_TESTNET_RPC_URL,
  SOLANA_DEVNET_RPC_URL,
  SOLANA_CHAIN_ID,
} from './solana.js';
