import { describe, it, expect, beforeEach } from 'vitest';
import {
  TEST_CONFIG,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
  MOCK_DATA,
} from '../helpers.js';
import { communicationTools } from '../../src/tools/communication.js';

function getTool(name: string) {
  const tool = communicationTools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

describe('communication tools', () => {
  beforeEach(() => {
    mockFetchSuccess(MOCK_DATA);
  });

  // ── listCallHistory ────────────────────────────────────────────────────────
  describe('listCallHistory', () => {
    it('GET /v1.0/communication/call with leadId', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('listCallHistory').handler({ leadId: 10 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/communication/call');
      expect(call.params.leadId).toBe('10');
      expect(call.body).toBeUndefined();
    });

    it('forwards offset, limit, currentId', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('listCallHistory').handler({ leadId: 1, offset: 5, limit: 25, currentId: 100 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.params.offset).toBe('5');
      expect(call.params.limit).toBe('25');
      expect(call.params.currentId).toBe('100');
    });

    it('returns error on 401', async () => {
      mockFetchError(401);
      const result = await getTool('listCallHistory').handler({ leadId: 1 }, TEST_CONFIG);
      expectError(result, 401);
    });
  });

  // ── listCallHistoryV2 ──────────────────────────────────────────────────────
  describe('listCallHistoryV2', () => {
    it('GET /v1.0/communication/call/v2 with leadId', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('listCallHistoryV2').handler({ leadId: 20 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/communication/call/v2');
      expect(call.params.leadId).toBe('20');
    });

    it('forwards pagination params', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('listCallHistoryV2').handler({ leadId: 2, offset: 10, limit: 50, currentId: 200 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.params.offset).toBe('10');
      expect(call.params.limit).toBe('50');
      expect(call.params.currentId).toBe('200');
    });
  });

  // ── listEmailHistory ───────────────────────────────────────────────────────
  describe('listEmailHistory', () => {
    it('GET /v1.0/communication/email with leadId', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('listEmailHistory').handler({ leadId: 30 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/communication/email');
      expect(call.params.leadId).toBe('30');
    });

    it('returns error on 404', async () => {
      mockFetchError(404);
      const result = await getTool('listEmailHistory').handler({ leadId: 99 }, TEST_CONFIG);
      expectError(result, 404);
    });
  });

  // ── listTextHistory ────────────────────────────────────────────────────────
  describe('listTextHistory', () => {
    it('GET /v1.0/communication/text with leadId', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('listTextHistory').handler({ leadId: 40 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/communication/text');
      expect(call.params.leadId).toBe('40');
    });
  });

  // ── searchCommunicationsByAgent ────────────────────────────────────────────
  describe('searchCommunicationsByAgent', () => {
    it('POST /v1.0/agent/communication, uppercasing type and converting times to epoch ms', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('searchCommunicationsByAgent').handler(
        { type: 'call', startTime: '2026-07-20T00:00:00Z', endTime: '2026-07-20T23:59:59Z', offset: 0, limit: 20 },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('POST');
      expect(call.pathname).toBe('/v1.0/agent/communication');
      // API requires the uppercase enum, not the lowercase value
      expect(call.body?.type).toBe('CALL');
      // API requires epoch milliseconds, not ISO strings
      expect(call.body?.startTime).toBe(Date.parse('2026-07-20T00:00:00Z'));
      expect(call.body?.endTime).toBe(Date.parse('2026-07-20T23:59:59Z'));
      expect(call.body?.offset).toBe(0);
      expect(call.body?.limit).toBe(20);
    });

    it('accepts epoch-millisecond timestamps as-is', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('searchCommunicationsByAgent').handler(
        { type: 'TEXT', startTime: 1784505600000, endTime: 1784591999000 },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(fetch);
      expect(call.body?.type).toBe('TEXT');
      expect(call.body?.startTime).toBe(1784505600000);
      expect(call.body?.endTime).toBe(1784591999000);
    });

    it('works with no body fields', async () => {
      const fetch = mockFetchSuccess({ items: [] });
      await getTool('searchCommunicationsByAgent').handler({}, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('POST');
      expect(call.pathname).toBe('/v1.0/agent/communication');
    });

    it('returns error on 500', async () => {
      mockFetchError(500);
      const result = await getTool('searchCommunicationsByAgent').handler({}, TEST_CONFIG);
      expectError(result, 500);
    });
  });

  // ── sendSms ────────────────────────────────────────────────────────────────
  describe('sendSms', () => {
    it('POST /v1.0/message/sms/send with required fields', async () => {
      const fetch = mockFetchSuccess({ sent: true });
      await getTool('sendSms').handler({ content: 'Hello!', leadId: 7 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('POST');
      expect(call.pathname).toBe('/v1.0/message/sms/send');
      expect(call.body?.content).toBe('Hello!');
      expect(call.body?.leadId).toBe(7);
    });

    it('forwards optional phoneNumber and phoneCode', async () => {
      const fetch = mockFetchSuccess({ sent: true });
      await getTool('sendSms').handler(
        { content: 'Hi', leadId: 8, phoneNumber: '+15551234567', phoneCode: '1' },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(fetch);
      expect(call.body?.phoneNumber).toBe('+15551234567');
      expect(call.body?.phoneCode).toBe('1');
    });

    it('returns error on 400', async () => {
      mockFetchError(400);
      const result = await getTool('sendSms').handler({ content: '', leadId: 0 }, TEST_CONFIG);
      expectError(result, 400);
    });
  });

  // ── sendEmail ──────────────────────────────────────────────────────────────
  describe('sendEmail', () => {
    it('POST /v1.0/message/email/send with required fields', async () => {
      const fetch = mockFetchSuccess({ sent: true });
      await getTool('sendEmail').handler(
        { subject: 'Hello', content: 'Body text', leadId: 9 },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('POST');
      expect(call.pathname).toBe('/v1.0/message/email/send');
      expect(call.body?.subject).toBe('Hello');
      expect(call.body?.content).toBe('Body text');
      expect(call.body?.leadId).toBe(9);
    });

    it('forwards optional toEmail', async () => {
      const fetch = mockFetchSuccess({ sent: true });
      await getTool('sendEmail').handler(
        { subject: 'Hi', content: 'Body', leadId: 10, toEmail: 'lead@example.com' },
        TEST_CONFIG,
      );
      const call = parseLastFetchCall(fetch);
      expect(call.body?.toEmail).toBe('lead@example.com');
    });

    it('returns error on 422', async () => {
      mockFetchError(422);
      const result = await getTool('sendEmail').handler({ subject: '', content: '', leadId: 0 }, TEST_CONFIG);
      expectError(result, 422);
    });
  });

  // ── getCallByCommId ────────────────────────────────────────────────────────
  describe('getCallByCommId', () => {
    it('GET /v2.0/communication/call/{communicationId}', async () => {
      const fetch = mockFetchSuccess(MOCK_DATA);
      await getTool('getCallByCommId').handler({ communicationId: 'comm-abc-123' }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v2.0/communication/call/comm-abc-123');
      expect(call.body).toBeUndefined();
    });

    it('does not forward communicationId as query param', async () => {
      const fetch = mockFetchSuccess(MOCK_DATA);
      await getTool('getCallByCommId').handler({ communicationId: 'comm-abc-123' }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.params.communicationId).toBeUndefined();
    });

    it('returns error on 404', async () => {
      mockFetchError(404);
      const result = await getTool('getCallByCommId').handler({ communicationId: 'missing' }, TEST_CONFIG);
      expectError(result, 404);
    });
  });

  // ── getEmailByCommId ───────────────────────────────────────────────────────
  describe('getEmailByCommId', () => {
    it('GET /v2.0/communication/email/{communicationId}', async () => {
      const fetch = mockFetchSuccess(MOCK_DATA);
      await getTool('getEmailByCommId').handler({ communicationId: 'email-xyz' }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v2.0/communication/email/email-xyz');
      expect(call.body).toBeUndefined();
    });

    it('returns error on 404', async () => {
      mockFetchError(404);
      const result = await getTool('getEmailByCommId').handler({ communicationId: 'missing' }, TEST_CONFIG);
      expectError(result, 404);
    });
  });

  // ── getTextByCommId ────────────────────────────────────────────────────────
  describe('getTextByCommId', () => {
    it('GET /v2.0/communication/text/{communicationId}', async () => {
      const fetch = mockFetchSuccess(MOCK_DATA);
      await getTool('getTextByCommId').handler({ communicationId: 'text-789' }, TEST_CONFIG);
      const call = parseLastFetchCall(fetch);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v2.0/communication/text/text-789');
      expect(call.body).toBeUndefined();
    });

    it('returns error on 404', async () => {
      mockFetchError(404);
      const result = await getTool('getTextByCommId').handler({ communicationId: 'missing' }, TEST_CONFIG);
      expectError(result, 404);
    });
  });

  // ── auth & meta ────────────────────────────────────────────────────────────
  it('sends Bearer auth header', async () => {
    const fetch = mockFetchSuccess({});
    await getTool('listCallHistory').handler({ leadId: 1 }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.headers['Authorization']).toBe('Bearer test-bearer-token-abc123');
  });

  it('strips MCP meta keys', async () => {
    const fetch = mockFetchSuccess({ items: [] });
    await getTool('listCallHistory').handler({ leadId: 1, _meta: 'x', __mcp: 'y' }, TEST_CONFIG);
    const call = parseLastFetchCall(fetch);
    expect(call.params._meta).toBeUndefined();
    expect(call.params.__mcp).toBeUndefined();
  });

  it('exports exactly 10 tools', () => {
    expect(communicationTools).toHaveLength(10);
  });
});
