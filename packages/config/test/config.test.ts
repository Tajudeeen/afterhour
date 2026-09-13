import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, reloadConfig, getConfig } from '../src/index.js';

describe('config', () => {
  beforeEach(() => {
    // Reset env to known state
    delete process.env.SOLANA_RPC_URL;
    delete process.env.SOLANA_CHAIN_ID;
    delete process.env.API_PORT;
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_MODEL;
    delete process.env.NEXT_PUBLIC_API_URL;
    reloadConfig();
  });

  describe('loadConfig', () => {
    it('loads with sensible defaults when optional vars are absent', () => {
      const c = loadConfig();
      expect(c.solana.chainId).toBe(101); // Solana mainnet
      expect(c.solana.rpcUrl).toContain('127.0.0.1'); // localnet default
      expect(c.apiPort).toBe(8787);
      expect(c.llmModel).toBe('gpt-4o-mini');
    });

    it('reads SOLANA_RPC_URL when set', () => {
      process.env.SOLANA_RPC_URL = 'https://custom.rpcurl';
      const c = loadConfig();
      expect(c.solana.rpcUrl).toBe('https://custom.rpcurl');
    });

    it('reads OPENAI_API_KEY when set', () => {
      process.env.OPENAI_API_KEY = 'sk-test-123';
      const c = loadConfig();
      expect(c.llmApiKey).toBe('sk-test-123');
    });

    it('returns null for llmApiKey when not set', () => {
      delete process.env.OPENAI_API_KEY;
      const c = loadConfig();
      expect(c.llmApiKey).toBeNull();
    });

    it('reads API_PORT when set', () => {
      process.env.API_PORT = '3000';
      const c = loadConfig();
      expect(c.apiPort).toBe(3000);
    });

    it('rejects unsafe API_PORT value 0', () => {
      process.env.API_PORT = '0';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });

    it('rejects unsafe API_PORT value 70000', () => {
      process.env.API_PORT = '70000';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });

    it('rejects unsafe API_PORT value -1', () => {
      process.env.API_PORT = '-1';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });

    it('rejects unsafe API_PORT value 1.5', () => {
      process.env.API_PORT = '1.5';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });

    it('rejects unsafe API_PORT value 9007199254740992', () => {
      process.env.API_PORT = '9007199254740992';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });

    it('rejects malformed API_PORT value abc', () => {
      process.env.API_PORT = 'abc';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });

    it('rejects malformed API_PORT value 3.14.15', () => {
      process.env.API_PORT = '3.14.15';
      expect(() => loadConfig()).toThrow(/Environment variable API_PORT/);
    });
  });

  describe('getConfig', () => {
    it('memoizes config between calls', () => {
      process.env.API_PORT = '4000';
      reloadConfig();
      const first = getConfig();
      const second = getConfig();
      expect(first).toBe(second);
      expect(second.apiPort).toBe(4000);
    });
  });
});
