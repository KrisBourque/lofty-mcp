import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getConfig,
  loftyRequest,
  formatError,
  LoftyApiError,
  LOFTY_BASE_URL,
  stripMeta,
  parseJsonPreservingBigIds,
} from '../src/client.js';
import { mockFetchSuccess, mockFetchError, TEST_CONFIG } from './helpers.js';

// ── getConfig ─────────────────────────────────────────────────────────────────

describe('getConfig', () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = { ...originalEnv }; });
  afterEach(() => { process.env = originalEnv; });

  it('throws when LOFTY_API_KEY is missing', () => {
    delete process.env.LOFTY_API_KEY;
    expect(() => getConfig()).toThrow('LOFTY_API_KEY');
  });

  it('throws on placeholder value YOUR_KEY_HERE', () => {
    process.env.LOFTY_API_KEY = 'YOUR_KEY_HERE';
    expect(() => getConfig()).toThrow('placeholder');
  });

  it('throws on placeholder value changeme', () => {
    process.env.LOFTY_API_KEY = 'changeme';
    expect(() => getConfig()).toThrow('placeholder');
  });

  it('returns config when key is set', () => {
    process.env.LOFTY_API_KEY = 'real-bearer-token';
    const config = getConfig();
    expect(config.apiKey).toBe('real-bearer-token');
  });

  it('defaults safeMode to true when LOFTY_SAFE_MODE is unset', () => {
    process.env.LOFTY_API_KEY = 'tok';
    delete process.env.LOFTY_SAFE_MODE;
    expect(getConfig().safeMode).toBe(true);
  });

  it('sets safeMode false when LOFTY_SAFE_MODE=false', () => {
    process.env.LOFTY_API_KEY = 'tok';
    process.env.LOFTY_SAFE_MODE = 'false';
    expect(getConfig().safeMode).toBe(false);
  });

  it('keeps safeMode true for any value other than "false"', () => {
    process.env.LOFTY_API_KEY = 'tok';
    process.env.LOFTY_SAFE_MODE = 'true';
    expect(getConfig().safeMode).toBe(true);
  });
});

// ── loftyRequest ──────────────────────────────────────────────────────────────

describe('loftyRequest', () => {
  it('builds correct URL from path', async () => {
    const fetch = mockFetchSuccess({ leads: [] });
    await loftyRequest('GET', '/v1.0/leads', { config: TEST_CONFIG });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`${LOFTY_BASE_URL}/v1.0/leads`),
      expect.any(Object)
    );
  });

  it('sets Authorization Bearer header', async () => {
    const fetch = mockFetchSuccess({});
    await loftyRequest('GET', '/v1.0/leads', { config: TEST_CONFIG });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Authorization']).toBe(`Bearer ${TEST_CONFIG.apiKey}`);
  });

  it('sets Content-Type application/json', async () => {
    const fetch = mockFetchSuccess({});
    await loftyRequest('POST', '/v1.0/leads', { config: TEST_CONFIG, body: {} });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('appends query params to URL', async () => {
    const fetch = mockFetchSuccess({});
    await loftyRequest('GET', '/v1.0/leads', {
      config: TEST_CONFIG,
      params: { stage: 'Active', limit: 25, offset: 0 },
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.get('stage')).toBe('Active');
    expect(parsed.searchParams.get('limit')).toBe('25');
    expect(parsed.searchParams.get('offset')).toBe('0');
  });

  it('omits null and undefined params', async () => {
    const fetch = mockFetchSuccess({});
    await loftyRequest('GET', '/v1.0/leads', {
      config: TEST_CONFIG,
      params: { stage: 'Active', source: undefined, assignedUserId: null as unknown as undefined },
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.searchParams.has('source')).toBe(false);
    expect(parsed.searchParams.has('assignedUserId')).toBe(false);
  });

  it('sends body as JSON for POST', async () => {
    const fetch = mockFetchSuccess({ id: 1 });
    await loftyRequest('POST', '/v1.0/leads', {
      config: TEST_CONFIG,
      body: { firstName: 'Jane', emails: ['jane@example.com'] },
    });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({
      firstName: 'Jane',
      emails: ['jane@example.com'],
    });
  });

  it('sends no body for GET', async () => {
    const fetch = mockFetchSuccess({});
    await loftyRequest('GET', '/v1.0/leads/1', { config: TEST_CONFIG });
    const [, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBeUndefined();
  });

  it('returns empty object for 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 204, statusText: 'No Content',
      headers: { get: () => null },
      json: () => Promise.reject(new Error('no body')),
      text: () => Promise.resolve(''),
    }));
    const result = await loftyRequest('DELETE', '/v1.0/leads/1', { config: TEST_CONFIG });
    expect(result).toEqual({});
  });

  it('throws LoftyApiError on non-ok response', async () => {
    mockFetchError(404, { message: 'Not found' });
    await expect(
      loftyRequest('GET', '/v1.0/leads/99', { config: TEST_CONFIG })
    ).rejects.toThrow(LoftyApiError);
  });

  it('throws LoftyApiError with correct status and endpoint', async () => {
    mockFetchError(401, { message: 'Unauthorized' });
    try {
      await loftyRequest('GET', '/v1.0/leads', { config: TEST_CONFIG });
    } catch (e) {
      expect(e).toBeInstanceOf(LoftyApiError);
      expect((e as LoftyApiError).status).toBe(401);
      expect((e as LoftyApiError).endpoint).toBe('/v1.0/leads');
    }
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    vi.useFakeTimers();
    const rateLimitResponse = {
      ok: false, status: 429, statusText: 'Too Many Requests',
      headers: { get: () => '0' },
      json: () => Promise.resolve({ message: 'rate limited' }),
      text: () => Promise.resolve('{"message":"rate limited"}'),
    };
    const successResponse = {
      ok: true, status: 200, statusText: 'OK',
      headers: { get: () => null },
      json: () => Promise.resolve({ leads: [] }),
      text: () => Promise.resolve('{"leads":[]}'),
    };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(rateLimitResponse)
      .mockResolvedValueOnce(successResponse));
    const promise = loftyRequest('GET', '/v1.0/leads', { config: TEST_CONFIG });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toEqual({ leads: [] });
    vi.useRealTimers();
  });
});

// ── formatError ───────────────────────────────────────────────────────────────

describe('formatError', () => {
  it('formats LoftyApiError with status, endpoint, details', () => {
    const err = new LoftyApiError(422, 'Unprocessable Entity', { field: 'email' }, '/v1.0/leads');
    const result = JSON.parse(formatError(err));
    expect(result.error).toBe(true);
    expect(result.status).toBe(422);
    expect(result.endpoint).toBe('/v1.0/leads');
    expect(result.details).toEqual({ field: 'email' });
  });

  it('formats generic Error', () => {
    const result = JSON.parse(formatError(new Error('oops')));
    expect(result.error).toBe(true);
    expect(result.message).toBe('oops');
  });

  it('formats unknown thrown values as string', () => {
    const result = JSON.parse(formatError('plain error'));
    expect(result.error).toBe(true);
    expect(result.message).toBe('plain error');
  });
});

// ── stripMeta ─────────────────────────────────────────────────────────────────

describe('stripMeta', () => {
  it('removes wait_for_previous', () => {
    expect(stripMeta({ id: 1, wait_for_previous: true })).toEqual({ id: 1 });
  });

  it('removes _meta', () => {
    expect(stripMeta({ id: 1, _meta: {} })).toEqual({ id: 1 });
  });

  it('removes __mcp', () => {
    expect(stripMeta({ id: 1, __mcp: 'x' })).toEqual({ id: 1 });
  });

  it('removes __progressToken', () => {
    expect(stripMeta({ id: 1, __progressToken: 'y' })).toEqual({ id: 1 });
  });

  it('preserves all non-meta keys', () => {
    const input = { leadId: 42, firstName: 'Jane', stage: 'Active' };
    expect(stripMeta(input)).toEqual(input);
  });
});

// ── parseJsonPreservingBigIds ────────────────────────────────────────────────

describe('parseJsonPreservingBigIds', () => {
  it('preserves int64 IDs that exceed Number.MAX_SAFE_INTEGER as exact strings', () => {
    // JSON.parse rounds this to ...573000, corrupting the ID. Compare string
    // forms — a numeric literal in this file would be rounded identically.
    const raw = '{"id": 1239258866013572993}';
    expect(String((JSON.parse(raw) as { id: number }).id)).not.toBe('1239258866013572993');
    const out = parseJsonPreservingBigIds(raw) as { id: string };
    expect(out.id).toBe('1239258866013572993');
  });

  it('leaves safe integers as numbers', () => {
    const out = parseJsonPreservingBigIds('{"leadId": 1139922729331754}') as { leadId: number };
    expect(typeof out.leadId).toBe('number');
    expect(out.leadId).toBe(1139922729331754);
  });

  it('handles oversized integers inside arrays', () => {
    const out = parseJsonPreservingBigIds('{"ids": [1239258866013572994, 5]}') as { ids: unknown[] };
    expect(out.ids[0]).toBe('1239258866013572994');
    expect(out.ids[1]).toBe(5);
  });

  it('does not alter digit sequences inside string values', () => {
    const out = parseJsonPreservingBigIds('{"note": "1239258866013572993"}') as { note: string };
    expect(out.note).toBe('1239258866013572993');
  });

  it('leaves negative and floating point values intact', () => {
    const out = parseJsonPreservingBigIds('{"a": -1, "b": 1.5}') as { a: number; b: number };
    expect(out.a).toBe(-1);
    expect(out.b).toBe(1.5);
  });
});
