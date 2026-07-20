import { type ToolDef, loftyRequest, formatError, stripMeta } from '../client.js';

export const notes: ToolDef[] = [
  {
    name: 'listNotes',
    description:
      'List notes for a lead, including system-generated notes by default (pass includeSystemNote:false to omit them). System notes carry real context — e.g. "The lead is interested in a showing" — and are easy to miss.',
    inputSchema: {
      type: 'object',
      required: ['leadId'],
      properties: {
        leadId: { type: 'integer', description: 'Lead ID (required)' },
        includeSystemNote: {
          type: 'boolean',
          description: 'Include system-generated notes. Defaults to true so no context is silently dropped.',
        },
      },
    },
    handler: async (args, config) => {
      try {
        const params = stripMeta(args);
        // The API omits system notes unless asked, which silently hides real
        // context from anything researching a lead. Default to including them.
        if (params.includeSystemNote === undefined) params.includeSystemNote = true;
        const data = await loftyRequest('GET', '/v1.0/notes', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'getNote',
    description: 'Get a single note by ID.',
    inputSchema: {
      type: 'object',
      required: ['noteId'],
      properties: {
        noteId: { type: 'integer', description: 'Note ID' },
      },
    },
    handler: async (args, config) => {
      try {
        const { noteId } = stripMeta(args);
        const data = await loftyRequest('GET', `/v1.0/notes/${noteId}`, { config });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'createNote',
    description: 'Create a note on a lead.',
    inputSchema: {
      type: 'object',
      required: ['content', 'leadId', 'isPin'],
      properties: {
        content: { type: 'string', description: 'Note text content' },
        leadId: { type: 'integer', description: 'Lead ID the note belongs to' },
        isPin: { type: 'boolean', description: 'Whether to pin the note' },
      },
    },
    handler: async (args, config) => {
      try {
        const body = stripMeta(args);
        const data = await loftyRequest('POST', '/v1.0/notes', { config, body });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'updateNote',
    description: 'Update an existing note by ID.',
    inputSchema: {
      type: 'object',
      required: ['noteId'],
      properties: {
        noteId: { type: 'integer', description: 'Note ID to update' },
        content: { type: 'string', description: 'Updated note text content' },
        isPin: { type: 'boolean', description: 'Whether to pin the note' },
      },
    },
    handler: async (args, config) => {
      try {
        const { noteId, ...rest } = stripMeta(args);
        const data = await loftyRequest('PUT', `/v1.0/notes/${noteId}`, {
          config,
          body: rest,
        });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'deleteNote',
    description: 'Delete a note by ID.',
    inputSchema: {
      type: 'object',
      required: ['noteId'],
      properties: {
        noteId: { type: 'integer', description: 'Note ID to delete' },
      },
    },
    handler: async (args, config) => {
      try {
        const { noteId } = stripMeta(args);
        const data = await loftyRequest('DELETE', `/v1.0/notes/${noteId}`, { config });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
