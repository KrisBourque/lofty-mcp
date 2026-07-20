import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';
import { notes } from '../../src/tools/notes.js';

function tool(name: string) {
  const t = notes.find((t) => t.name === name);
  if (!t) throw new Error(`Tool "${name}" not found`);
  return t;
}

describe('notes tools', () => {
  beforeEach(() => {
    mockFetchSuccess({ items: [] });
  });

  // ── listNotes ─────────────────────────────────────────────────────────────
  describe('listNotes', () => {
    it('GET /v1.0/notes with required leadId', async () => {
      const mock = mockFetchSuccess({ items: [] });
      await tool('listNotes').handler({ leadId: 42 }, TEST_CONFIG);
      const call = parseLastFetchCall(mock);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/notes');
      expect(call.params.leadId).toBe('42');
    });

    it('forwards includeSystemNote param', async () => {
      const mock = mockFetchSuccess({ items: [] });
      await tool('listNotes').handler(
        { leadId: 42, includeSystemNote: true },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(mock);
      expect(call.params.includeSystemNote).toBe('true');
    });

    it('defaults includeSystemNote to true so system notes are not silently dropped', async () => {
      const mock = mockFetchSuccess({ items: [] });
      await tool('listNotes').handler({ leadId: 42 }, TEST_CONFIG);
      const call = parseLastFetchCall(mock);
      expect(call.params.includeSystemNote).toBe('true');
    });

    it('still honors an explicit includeSystemNote:false', async () => {
      const mock = mockFetchSuccess({ items: [] });
      await tool('listNotes').handler(
        { leadId: 42, includeSystemNote: false },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(mock);
      expect(call.params.includeSystemNote).toBe('false');
    });

    it('returns error on 401', async () => {
      mockFetchError(401);
      const result = await tool('listNotes').handler({ leadId: 1 }, TEST_CONFIG);
      expectError(result, 401);
    });
  });

  // ── getNote ───────────────────────────────────────────────────────────────
  describe('getNote', () => {
    it('GET /v1.0/notes/{noteId}', async () => {
      const mock = mockFetchSuccess({ id: 7 });
      await tool('getNote').handler({ noteId: 7 }, TEST_CONFIG);
      const call = parseLastFetchCall(mock);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/notes/7');
    });

    it('returns error on 404', async () => {
      mockFetchError(404);
      const result = await tool('getNote').handler({ noteId: 999 }, TEST_CONFIG);
      expectError(result, 404);
    });
  });

  // ── createNote ────────────────────────────────────────────────────────────
  describe('createNote', () => {
    it('POST /v1.0/notes with required fields', async () => {
      const mock = mockFetchSuccess({ id: 10 });
      await tool('createNote').handler(
        { content: 'Called today', leadId: 42, isPin: false },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(mock);
      expect(call.method).toBe('POST');
      expect(call.pathname).toBe('/v1.0/notes');
      expect(call.body?.content).toBe('Called today');
      expect(call.body?.leadId).toBe(42);
      expect(call.body?.isPin).toBe(false);
    });

    it('returns error on 422', async () => {
      mockFetchError(422);
      const result = await tool('createNote').handler(
        { content: '', leadId: 1, isPin: false },
        TEST_CONFIG,
      );
      expectError(result, 422);
    });
  });

  // ── updateNote ────────────────────────────────────────────────────────────
  describe('updateNote', () => {
    it('PUT /v1.0/notes/{noteId}', async () => {
      const mock = mockFetchSuccess({});
      await tool('updateNote').handler(
        { noteId: 8, content: 'Updated content', isPin: true },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(mock);
      expect(call.method).toBe('PUT');
      expect(call.pathname).toBe('/v1.0/notes/8');
      expect(call.body?.content).toBe('Updated content');
      expect(call.body?.isPin).toBe(true);
      // noteId must NOT appear in body
      expect(call.body?.noteId).toBeUndefined();
    });

    it('returns error on 404', async () => {
      mockFetchError(404);
      const result = await tool('updateNote').handler(
        { noteId: 999, content: 'x', isPin: false },
        TEST_CONFIG,
      );
      expectError(result, 404);
    });
  });

  // ── deleteNote ────────────────────────────────────────────────────────────
  describe('deleteNote', () => {
    it('DELETE /v1.0/notes/{noteId}', async () => {
      const mock = mockFetchSuccess({});
      await tool('deleteNote').handler({ noteId: 9 }, TEST_CONFIG);
      const call = parseLastFetchCall(mock);
      expect(call.method).toBe('DELETE');
      expect(call.pathname).toBe('/v1.0/notes/9');
    });

    it('returns error on 403', async () => {
      mockFetchError(403);
      const result = await tool('deleteNote').handler({ noteId: 9 }, TEST_CONFIG);
      expectError(result, 403);
    });
  });

  // ── auth header ───────────────────────────────────────────────────────────
  it('sends Bearer auth header', async () => {
    const mock = mockFetchSuccess({});
    await tool('listNotes').handler({ leadId: 1 }, TEST_CONFIG);
    const call = parseLastFetchCall(mock);
    expect(call.headers['Authorization']).toBe('Bearer test-bearer-token-abc123');
  });
});
