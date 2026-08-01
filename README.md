# Lofty MCP Server

[![npm version](https://img.shields.io/npm/v/@nerdsnipe-inc/lofty-mcp)](https://www.npmjs.com/package/@nerdsnipe-inc/lofty-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@nerdsnipe-inc/lofty-mcp)](https://www.npmjs.com/package/@nerdsnipe-inc/lofty-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js: >=18](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![Lofty API](https://img.shields.io/badge/Lofty-API-6B21A8)](https://api.lofty.com)
[![MCP Badge](https://lobehub.com/badge/mcp/nerdsnipe-inc-lofty-mcp)](https://lobehub.com/mcp/nerdsnipe-inc-lofty-mcp)

**Give any AI agent full access to your Lofty (formerly Chime) CRM via natural language.**

> "Find all leads in the Active stage assigned to John and send them an SMS follow-up"  
> "Create a task for lead 12345 to call back tomorrow at 9am"  
> "Show me all transactions over $500k that closed this quarter"

120 tools across 22 modules — full coverage of the Lofty API.

---

## What is this?

This is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that wraps the Lofty (formerly Chime) CRM API. Connect it to Claude, Cursor, Windsurf, or any MCP-compatible AI client and your agent can read and write your entire Lofty account using plain English.

**Example prompts:**

- "List all leads tagged 'Hot Buyer' who haven't had activity in the last 7 days"
- "Create a call task for lead 9876 assigned to agent Sarah, due in 2 hours"
- "Send an SMS to lead 1234: 'Hi, just checking in — are you still looking?'"
- "Add a note to lead 5678: 'Interested in 3BR, budget $650k, preapproved'"
- "Get all transactions for lead 1234 and show me the property addresses"

---

## Tool Summary

| Module | Tools | Description |
|--------|------:|-------------|
| Sales Agents | 13 | Agent profiles, working leads, plan tasks |
| Leads | 12 | Lead management, assignment, activity |
| Communication | 10 | SMS, email, call history |
| Transactions | 9 | Transaction management |
| Tasks V2 | 8 | Modern task API with appointments |
| Calendar | 7 | Calendar items and meeting slots |
| Tasks V1 | 6 | Legacy task API |
| Team Features | 6 | Tags, custom fields, pipelines, ponds |
| Lead Routing | 6 | Routing rules and roles |
| Intelligent | 6 | AI call scripts, summaries, analysis |
| Notes | 5 | Lead notes |
| Agent Org | 5 | Organization, offices, permissions |
| Notifications | 4 | Push, SMS, and email notifications |
| Members | 4 | Team member management |
| Lead Manual Log | 4 | Manual activity log types |
| Webhooks | 3 | Webhook subscriptions |
| Calls | 3 | Call records and recordings |
| Listing | 3 | Published listings |
| Agent User | 2 | Add agents and tags |
| Meta | 2 | Server info and help |
| System Logs | 1 | Lead system logs |
| Vendor | 1 | Vendor listing |
| **Total** | **120** | |

> **Safe mode** (default): 7 delete/destructive tools are disabled — 113 tools active. Set `LOFTY_SAFE_MODE=false` to enable all 120.

---

## Prerequisites

### 1. Node.js 18+

```bash
node --version  # must be v18.0.0 or higher
```

### 2. Lofty API Key or OAuth Token

Lofty supports two authentication methods — both go in the same `LOFTY_API_KEY` environment variable as a Bearer token:

**OAuth2 Access Token (recommended for production):**
1. Register your application in the Lofty developer portal
2. Complete the OAuth2 flow to obtain an access token
3. Use the access token as your `LOFTY_API_KEY`

**API Key (for testing/scripts):**
1. Log in to your Lofty account
2. Go to **Settings → API Keys** (or contact Lofty support)
3. Generate and copy your API key

> **Note:** The Lofty v1 legacy API is scheduled for sunset on **August 1, 2026**. The tools in this server target the current v2 API paths where available.

---

## Installation

### Run without installing (recommended)

```bash
# npx
npx @nerdsnipe-inc/lofty-mcp

# pnpm
pnpm dlx @nerdsnipe-inc/lofty-mcp

# bunx
bunx @nerdsnipe-inc/lofty-mcp
```

### Install globally

```bash
npm install -g @nerdsnipe-inc/lofty-mcp
lofty-mcp
```

---

## Connecting to AI Clients

### Claude Desktop

Edit your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lofty": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/lofty-mcp"],
      "env": {
        "LOFTY_API_KEY": "your_bearer_token_here"
      }
    }
  }
}
```

With safe mode disabled:

```json
{
  "mcpServers": {
    "lofty": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/lofty-mcp"],
      "env": {
        "LOFTY_API_KEY": "your_bearer_token_here",
        "LOFTY_SAFE_MODE": "false"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Claude Code (CLI)

```bash
claude mcp add lofty \
  -e LOFTY_API_KEY=your_bearer_token_here \
  -- npx -y @nerdsnipe-inc/lofty-mcp
```

Or add manually to `.claude/mcp.json` in your project:

```json
{
  "mcpServers": {
    "lofty": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/lofty-mcp"],
      "env": {
        "LOFTY_API_KEY": "your_bearer_token_here"
      }
    }
  }
}
```

### Cursor

Open **Settings → MCP** and add:

```json
{
  "mcpServers": {
    "lofty": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/lofty-mcp"],
      "env": {
        "LOFTY_API_KEY": "your_bearer_token_here"
      }
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP config:

```json
{
  "mcpServers": {
    "lofty": {
      "command": "npx",
      "args": ["-y", "@nerdsnipe-inc/lofty-mcp"],
      "env": {
        "LOFTY_API_KEY": "your_bearer_token_here"
      }
    }
  }
}
```

### Any MCP-compatible client

Use the stdio transport command: `npx -y @nerdsnipe-inc/lofty-mcp`

---

## Running from Source

```bash
git clone https://github.com/nerdsnipe-inc/lofty-mcp
cd lofty-mcp
npm install

# Development (no build needed)
LOFTY_API_KEY=your_token npx tsx src/index.ts

# Build and run
npm run build
LOFTY_API_KEY=your_token node dist/index.js
```

---

## Tool Reference

### Leads (12 tools)

| Tool | Description |
|------|-------------|
| `listLeads` | List leads with optional filters |
| `getLead` | Get a single lead by ID |
| `createLead` | Create a new lead |
| `updateLead` | Update an existing lead by ID |
| `deleteLead` | Delete a lead by ID (reason required) *(safe mode blocked)* |
| `assignLead` | Assign a lead to a user |
| `updateLeadInquiry` | Update a lead's property inquiry preferences |
| `updateLeadProperty` | Update a lead's current property information |
| `logLeadActivity` | Log an activity event against a lead |
| `getLeadActivitiesV1` | Get activity history (v1, page-based) |
| `getLeadActivitiesV2` | Get activity history (v2, cursor-based with timezone support) |
| `getAssigneeInfo` | Look up the assignee agent by phone, email, or external ID |

### Sales Agents (13 tools)

| Tool | Description |
|------|-------------|
| `getCurrentSalesAgent` | Get the current authenticated sales agent profile |
| `getSalesAgentByLead` | Get the sales agent assigned to a specific lead |
| `getSalesAgentQuota` | Get the current sales agent quota |
| `getSalesAgentSettings` | Get sales agent settings |
| `saveSalesAgentSettings` | Save/update sales agent settings |
| `getWorkingLeads` | List working leads for the current sales agent |
| `addWorkingLeads` | Add leads to the working leads list |
| `checkWorkingLead` | Check if a specific lead is in the working leads list |
| `muteLead` | Mute or unmute a working lead |
| `getMuteStatus` | Get the mute status for a lead |
| `sendSmsViaAiNumber` | Send an SMS to the agent via the AI number |
| `batchCreatePlanTasks` | Batch create plan tasks for a lead |
| `getPlanTasksByLead` | Get plan tasks for a specific lead |

### Tasks V2 (8 tools)

| Tool | Description |
|------|-------------|
| `listTasksV2` | List tasks for a lead (v2 API) |
| `getTaskV2` | Get a single task by ID (v2 API) |
| `createTaskV2` | Create a task or appointment (v2 API) |
| `updateTaskV2` | Update a task by ID (v2 API) |
| `deleteTaskV2` | Delete a task by ID (v2 API) *(safe mode blocked)* |
| `finishTaskV2` | Mark a task as finished |
| `unfinishTaskV2` | Reopen a finished task |
| `listMyTasksV2` | List tasks assigned to the authenticated user |

### Communication (10 tools)

| Tool | Description |
|------|-------------|
| `listCallHistory` | List call communication history for a lead |
| `listCallHistoryV2` | List call communication history (v2 endpoint) |
| `listEmailHistory` | List email communication history for a lead |
| `listTextHistory` | List SMS/text communication history for a lead |
| `searchCommunicationsByAgent` | Search communications by agent with filters |
| `sendSms` | Send an SMS message to a lead |
| `sendEmail` | Send an email message to a lead |
| `getCallByCommId` | Get a call communication record by communication ID (v2) |
| `getEmailByCommId` | Get an email communication record by communication ID (v2) |
| `getTextByCommId` | Get a text/SMS communication record by communication ID (v2) |

### Transactions (9 tools)

| Tool | Description |
|------|-------------|
| `listLeadTransactions` | List all transactions for a lead |
| `addTransaction` | Add a new transaction to a lead |
| `getTransaction` | Get a specific transaction for a lead |
| `updateTransaction` | Update an existing transaction |
| `getTransactionPropertyAddress` | Get the property address for a transaction |
| `updateTransactionPropertyAddress` | Update the property address for a transaction |
| `getTransactionCustomFields` | Get the list of custom fields for transactions |
| `searchTransactionsV2` | Search transactions with optional filters (v2) |
| `updateBrokermintTransaction` | Update a Brokermint transaction (callback format) |

### Calendar (7 tools)

| Tool | Description |
|------|-------------|
| `queryCalendars` | Query calendar items for a lead (v2 API) |
| `createCalendar` | Create a calendar item — TASK or APPOINTMENT |
| `updateCalendar` | Update a calendar item by composite ID |
| `deleteCalendar` | Delete a calendar item by composite ID *(safe mode blocked)* |
| `finishCalendar` | Mark a calendar item as finished |
| `unfinishCalendar` | Reopen a finished calendar item |
| `getAvailableMeetings` | Get available meeting slots for a lead |

### Tasks V1 (6 tools)

| Tool | Description |
|------|-------------|
| `listTasksV1` | List tasks for a lead (v1 API) |
| `getTaskV1` | Get a single task by ID (v1 API) |
| `createTaskV1` | Create a task (v1 API) |
| `updateTaskV1` | Update a task by ID (v1 API) |
| `deleteTaskV1` | Delete a task by ID (v1 API) *(safe mode blocked)* |
| `listAppointments` | List appointments for a lead (v1 API) |

### Team Features (6 tools)

| Tool | Description |
|------|-------------|
| `listTags` | List all tags defined for the team |
| `listCustomFields` | List all custom fields for the team |
| `addCustomField` | Add or update a custom field value |
| `listPipelines` | List all lead pipelines for the team |
| `listLeadPonds` | List all lead ponds for the team |
| `getLeadPond` | Get a specific lead pond by ID |

### Lead Routing (6 tools)

| Tool | Description |
|------|-------------|
| `listRoutingRules` | List routing rules for a business type |
| `updateRoutingRule` | Update a routing rule |
| `getSupplementRule` | Get supplement routing rule |
| `updateSupplementRule` | Update supplement routing rule |
| `listRoutingRoles` | List all routing roles |
| `listAssignMembers` | List assign members for a business type |

### Intelligent (AI) (6 tools)

| Tool | Description |
|------|-------------|
| `generateCallScript` | Generate an AI call script for a lead |
| `getCallSummary` | Get AI call summary for a lead |
| `generateCallSummary` | Generate an AI call summary for a call |
| `listLeadAnalysis` | List AI lead analysis entries |
| `createLeadAnalysis` | Create an AI lead analysis |
| `generatePrepareInsight` | Generate AI prepare insight for a lead |

### Notes (5 tools)

| Tool | Description |
|------|-------------|
| `listNotes` | List notes for a lead |
| `getNote` | Get a single note by ID |
| `createNote` | Create a note on a lead |
| `updateNote` | Update an existing note |
| `deleteNote` | Delete a note by ID *(safe mode blocked)* |

### Agent Org (5 tools)

| Tool | Description |
|------|-------------|
| `getOrgInfo` | Get organization info |
| `updateCompany` | Update company information |
| `addOffice` | Add a new office to the organization |
| `updateOffice` | Update an existing office |
| `getPermissionProfiles` | Get permission profiles for the organization |

### Notifications (4 tools)

| Tool | Description |
|------|-------------|
| `sendOpportunityNotification` | Send an opportunity notification to an agent |
| `sendAppPushTaskReminder` | Send an app push task reminder |
| `sendSystemSmsToAgent` | Send a system SMS to an agent |
| `sendSystemEmailToAgent` | Send a system email to an agent |

### Members (4 tools)

| Tool | Description |
|------|-------------|
| `getMe` | Get the current authenticated user profile |
| `listMembers` | List all members in the team |
| `getMemberByAccount` | Get a member by their account email |
| `getMemberById` | Get a member by their numeric user ID |

### Lead Manual Log (4 tools)

| Tool | Description |
|------|-------------|
| `listManualLogTypes` | List all manual log types |
| `createManualLogType` | Create a new manual log type |
| `getManualLogType` | Get a manual log type by ID |
| `deleteManualLogType` | Delete a manual log type by ID *(safe mode blocked)* |

### Webhooks (3 tools)

| Tool | Description |
|------|-------------|
| `listWebhooks` | List all webhook subscriptions |
| `createWebhook` | Subscribe to a Lofty webhook event |
| `deleteWebhook` | Delete a webhook subscription *(safe mode blocked)* |

### Calls (3 tools)

| Tool | Description |
|------|-------------|
| `listCalls` | List call records for a lead |
| `getCallRecord` | Get a single call record by ID |
| `getCallRecordUrl` | Get the recording URL for a call |

### Listing (3 tools)

| Tool | Description |
|------|-------------|
| `getPublishedListings` | Get published listings for a site |
| `getListingsByAgent` | Get listings associated with a specific agent |
| `searchListingsV2` | Search listings with advanced filters |

### Agent User (2 tools)

| Tool | Description |
|------|-------------|
| `addAgent` | Add a new agent profile |
| `addAgentTag` | Add tags to an agent |

### Meta (2 tools)

| Tool | Description |
|------|-------------|
| `about` | Get information about this MCP server |
| `help` | Get usage tips and examples |

### System Logs (1 tool)

| Tool | Description |
|------|-------------|
| `getSystemLogs` | Get system logs for a specific lead |

### Vendor (1 tool)

| Tool | Description |
|------|-------------|
| `getVendors` | List vendors |

---

## Example Prompts

**Lead management:**
- "List all leads in the Active pipeline that haven't had any activity in 14 days"
- "Create a new lead: Jane Smith, jane@example.com, (555) 987-6543, assign to agent ID 42"
- "Update lead 1234: set stage to 'Nurture' and add a note 'Pre-approved, looking for spring'"

**Tasks and scheduling:**
- "Create a call task for lead 5678 due tomorrow at 10am, assign to current agent"
- "List all unfinished tasks assigned to me that are overdue"
- "Mark task 9012 as finished"

**Communication:**
- "Send an SMS to lead 3456: 'Hi! Just wanted to follow up — still looking in the area?'"
- "Show me all email history for lead 7890"
- "Search for all communications from agent John in the last 30 days"

**AI features:**
- "Generate a call script for lead 1111 — they're interested in buying a 3BR in Austin"
- "Get the AI call summary for lead 2222's last call"
- "Create a lead analysis for lead 3333 with current market insights"

**Transactions:**
- "List all transactions for lead 4444 and show the property addresses"
- "Search for all transactions over $750k that closed this year"
- "Add a transaction to lead 5555: $620,000 purchase, 123 Main St"

**Team and admin:**
- "List all tags defined for our team"
- "Get the current routing rules for the residential business type"
- "Show me all members of the team and their email addresses"

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LOFTY_API_KEY` | Yes | — | Your Lofty Bearer token (OAuth2 access token or API key) |
| `LOFTY_SAFE_MODE` | No | `"true"` | Set to `"false"` to enable delete/destructive tools |

---

## Development

### Scripts

```bash
npm run build          # compile TypeScript to dist/
npm run dev            # watch mode with tsx
npm test               # run all tests with vitest
npm run test:watch     # watch mode for tests
npm run test:coverage  # coverage report
```

### Project structure

```
chime-lofty-mcp-server/
├── src/
│   ├── index.ts          # server entry point (stdio transport)
│   ├── client.ts         # HTTP client, config, LoftyApiError, stripMeta
│   └── tools/
│       ├── leads.ts
│       ├── tasks_v1.ts
│       ├── tasks_v2.ts
│       ├── calendar.ts
│       ├── notes.ts
│       ├── calls.ts
│       ├── communication.ts
│       ├── transactions.ts
│       ├── webhooks.ts
│       ├── sales_agents.ts
│       ├── intelligent.ts
│       ├── notifications.ts
│       ├── members.ts
│       ├── team_features.ts
│       ├── lead_routing.ts
│       ├── lead_manual_log.ts
│       ├── agent_org.ts
│       ├── agent_user.ts
│       ├── vendor.ts
│       ├── listing.ts
│       ├── system_logs.ts
│       └── meta.ts
├── tests/
│   ├── helpers.ts
│   ├── client.test.ts    # 26 tests
│   ├── server.test.ts    # 56 tests
│   └── tools/            # one file per module
├── bin/
│   └── lofty-mcp.js
├── dist/                 # compiled output
└── package.json
```

### Adding a new tool

1. Find the module file under `src/tools/` for the matching resource (or create a new one).
2. Add a `ToolDef` entry with `name`, `description`, `inputSchema`, and `handler`.
3. Export it from the module array and import it in `src/index.ts`.
4. Add a test in `tests/tools/`.
5. Run `npm test` to confirm green.

### Authentication

The Lofty API uses Bearer token authentication. Every request includes:

```
Authorization: Bearer <LOFTY_API_KEY>
Content-Type: application/json
Accept: application/json
```

Both OAuth2 access tokens and static API keys use the same header format.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `LOFTY_API_KEY is not set` | Missing env var | Add `LOFTY_API_KEY` to your MCP config env block |
| `LOFTY_API_KEY is set to a placeholder` | Left the default value | Replace with your real Lofty bearer token |
| `401 Unauthorized` | Invalid or expired token | Re-generate your API key or refresh your OAuth access token |
| `403 Forbidden` | Insufficient permissions for this endpoint | Check your account permissions or use an admin token |
| Tool not found | Safe mode is on | Set `LOFTY_SAFE_MODE=false` or use a non-delete tool |
| `429 Too Many Requests` | Lofty rate limit hit | Built-in retry with backoff — reduce request frequency if persistent |
| Server not showing in Claude Desktop | Config file syntax error or wrong path | Validate JSON, check file path for your OS |

---

## Contributing

Issues and PRs welcome. Please open an issue first for significant changes.

1. Fork the repo
2. Create a feature branch
3. Add tests for your change
4. Run `npm test` — all must pass
5. Submit a PR

---

## License

MIT

---

## Related

- [Lofty (formerly Chime) CRM](https://www.lofty.com)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Follow Up Boss MCP Server](https://github.com/nerdsnipe-inc/follow-up-boss-mcp) — same pattern for FUB CRM
- [GHL MCP Server](https://github.com/nerdsnipe-inc/ghl-mcp-server) — same pattern for [Free Trial GoHighLevel](https://www.gohighlevel.com/?fp_ref=nerdsnipe-inc)
