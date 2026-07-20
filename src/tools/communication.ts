import { loftyRequest, formatError, stripMeta } from '../client.js';
import type { LoftyConfig, ToolDef } from '../client.js';

/** Shared query params for the four communication history endpoints. */
const historyQuerySchema = {
  type: 'object',
  properties: {
    leadId: { type: 'integer', description: 'ID of the lead (required)' },
    offset: { type: 'integer', description: 'Pagination offset' },
    limit: { type: 'integer', description: 'Max number of results to return' },
    currentId: { type: 'integer', description: 'Cursor ID for pagination' },
  },
  required: ['leadId'],
};

export const communicationTools: ToolDef[] = [
  // ── v1.0 history ────────────────────────────────────────────────────────────
  {
    name: 'listCallHistory',
    description: 'List call communication history for a lead.',
    inputSchema: historyQuerySchema,
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const params = stripMeta(args);
        const data = await loftyRequest('GET', '/v1.0/communication/call', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'listCallHistoryV2',
    description: 'List call communication history for a lead (v2 endpoint).',
    inputSchema: historyQuerySchema,
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const params = stripMeta(args);
        const data = await loftyRequest('GET', '/v1.0/communication/call/v2', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'listEmailHistory',
    description: 'List email communication history for a lead.',
    inputSchema: historyQuerySchema,
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const params = stripMeta(args);
        const data = await loftyRequest('GET', '/v1.0/communication/email', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'listTextHistory',
    description: 'List SMS/text communication history for a lead.',
    inputSchema: historyQuerySchema,
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const params = stripMeta(args);
        const data = await loftyRequest('GET', '/v1.0/communication/text', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  // ── search by agent ──────────────────────────────────────────────────────────
  {
    name: 'searchCommunicationsByAgent',
    description:
      'Search the agent\'s communications (calls, texts, emails) in a time window — includes INBOUND messages, so this is how you detect lead replies. NOTE: the API caps a single query at a 24-hour window.',
    inputSchema: {
      type: 'object',
      properties: {
        startTime: { type: 'string', description: 'Start of window — ISO 8601 string or epoch milliseconds (required)' },
        endTime: { type: 'string', description: 'End of window — ISO 8601 string or epoch ms. Max 24h after startTime (required)' },
        type: { type: 'string', enum: ['CALL', 'TEXT', 'EMAIL'], description: 'Communication type (required)' },
        teamView: { type: 'boolean', description: "Include team leads' communications. Default false." },
        offset: { type: 'integer', description: 'Pagination offset (default 0)' },
        limit: { type: 'integer', description: 'Max results (default 10, max 1000)' },
      },
      required: ['startTime', 'endTime', 'type'],
    },
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const a = stripMeta(args);
        // The API requires: UPPERCASE type enum, and epoch-millisecond timestamps
        // (not ISO strings). Accept either form from the caller and normalize.
        const toEpochMs = (v: unknown): number | undefined => {
          if (v == null) return undefined;
          if (typeof v === 'number') return v;
          const s = String(v);
          if (/^\d+$/.test(s)) return Number(s);
          const t = Date.parse(s);
          return Number.isNaN(t) ? undefined : t;
        };
        const body: Record<string, unknown> = {
          type: a.type ? String(a.type).toUpperCase() : undefined,
          startTime: toEpochMs(a.startTime),
          endTime: toEpochMs(a.endTime),
          offset: a.offset ?? 0,
          limit: a.limit ?? 50,
        };
        if (a.teamView !== undefined) body.teamView = a.teamView === true;
        const data = await loftyRequest('POST', '/v1.0/agent/communication', { config, body });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  // ── send messages ─────────────────────────────────────────────────────────────
  {
    name: 'sendSms',
    description: 'Send an SMS message to a lead.',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'SMS message text (required)' },
        leadId: { type: 'integer', description: 'ID of the lead (required)' },
        phoneNumber: { type: 'string', description: 'Destination phone number' },
        phoneCode: { type: 'string', description: 'Country phone code' },
      },
      required: ['content', 'leadId'],
    },
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const body = stripMeta(args);
        const data = await loftyRequest('POST', '/v1.0/message/sms/send', { config, body });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'sendEmail',
    description: 'Send an email message to a lead.',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'Email subject (required)' },
        content: { type: 'string', description: 'Email body content (required)' },
        leadId: { type: 'integer', description: 'ID of the lead (required)' },
        toEmail: { type: 'string', description: 'Override recipient email address' },
      },
      required: ['subject', 'content', 'leadId'],
    },
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const body = stripMeta(args);
        const data = await loftyRequest('POST', '/v1.0/message/email/send', { config, body });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  // ── v2.0 by communication ID ──────────────────────────────────────────────────
  {
    name: 'getCallByCommId',
    description: 'Get a call communication record by its communication ID (v2).',
    inputSchema: {
      type: 'object',
      properties: {
        communicationId: { type: 'string', description: 'Communication record ID' },
      },
      required: ['communicationId'],
    },
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const { communicationId, ...rest } = stripMeta(args);
        const data = await loftyRequest('GET', `/v2.0/communication/call/${communicationId}`, {
          config,
          params: Object.keys(rest).length ? rest : undefined,
        });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'getEmailByCommId',
    description: 'Get an email communication record by its communication ID (v2).',
    inputSchema: {
      type: 'object',
      properties: {
        communicationId: { type: 'string', description: 'Communication record ID' },
      },
      required: ['communicationId'],
    },
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const { communicationId, ...rest } = stripMeta(args);
        const data = await loftyRequest('GET', `/v2.0/communication/email/${communicationId}`, {
          config,
          params: Object.keys(rest).length ? rest : undefined,
        });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'getTextByCommId',
    description: 'Get a text/SMS communication record by its communication ID (v2).',
    inputSchema: {
      type: 'object',
      properties: {
        communicationId: { type: 'string', description: 'Communication record ID' },
      },
      required: ['communicationId'],
    },
    handler: async (args: Record<string, unknown>, config: LoftyConfig): Promise<string> => {
      try {
        const { communicationId, ...rest } = stripMeta(args);
        const data = await loftyRequest('GET', `/v2.0/communication/text/${communicationId}`, {
          config,
          params: Object.keys(rest).length ? rest : undefined,
        });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
