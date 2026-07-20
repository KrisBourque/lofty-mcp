import { type ToolDef, loftyRequest, formatError, stripMeta } from '../client.js';

export const listing: ToolDef[] = [
  {
    name: 'getPublishedListings',
    description: 'Get published listings for a site, with optional pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Site ID to filter listings by' },
        page: { type: 'integer', description: 'Page number for pagination' },
        pageSize: { type: 'integer', description: 'Number of results per page' },
      },
    },
    handler: async (args, config) => {
      try {
        const params = stripMeta(args);
        const data = await loftyRequest('GET', '/v1.0/getPublishedListings', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'getListingsByAgent',
    description: 'Get listings associated with a specific agent by agent ID.',
    inputSchema: {
      type: 'object',
      properties: {
        agentId: { type: 'integer', description: 'Agent ID to filter listings by' },
      },
    },
    handler: async (args, config) => {
      try {
        const params = stripMeta(args);
        const data = await loftyRequest('GET', '/v1.0/listing', { config, params });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },

  {
    name: 'searchListingsV2',
    description:
      'Search MLS listings with LIVE status (Active/Pending/Sold) using filters such as price range, beds/baths, sqft, property type, purchase type, days-on-site, and location (v2). Returns listingStatus, soldListingYN, daysOnList, and price so you can verify whether a specific listing is still available.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Keyword search term (address, MLS #, etc.)' },
        priceMin: { type: 'number', description: 'Minimum listing price' },
        priceMax: { type: 'number', description: 'Maximum listing price' },
        bedroomsMin: { type: 'number', description: 'Minimum number of bedrooms' },
        bathroomsMin: { type: 'number', description: 'Minimum number of bathrooms' },
        sqFtMin: { type: 'number', description: 'Minimum square footage' },
        sqFtMax: { type: 'number', description: 'Maximum square footage' },
        propertyType: { type: 'string', description: 'Property type label, e.g. "Vacant Land", "Single Family Home", "Condo"' },
        purchaseType: { type: 'string', description: 'Purchase type label, e.g. "For Sale", "For Rent"' },
        daysOnSite: { type: 'integer', description: 'Only listings added within the last N days' },
        city: { type: 'string', description: 'City to search within' },
        state: { type: 'string', description: 'State to search within (2-letter code)' },
        zipCode: { type: 'string', description: 'ZIP code to search within' },
        soldFlag: { type: 'boolean', description: 'Search sold listings instead of active. Default false.' },
        searchScope: { type: 'string', description: "'my' (agent's listings), 'office', or 'all' (default 'all')" },
        sort: { type: 'string', description: 'Sort field, e.g. PRICE_ASC, PRICE_DESC, MLS_LIST_DATE_L_DESC, RELEVANCE' },
        pageNum: { type: 'integer', description: 'Page number, starting at 1' },
        pageSize: { type: 'integer', description: 'Results per page (default 25)' },
        limit: { type: 'integer', description: 'Alias for pageSize' },
      },
    },
    handler: async (args, config) => {
      try {
        const a = stripMeta(args);
        // The /v2.0/listings/search API expects filters nested under `filterConditions`
        // (keys from the property.condition table), NOT flat query fields. Ranges are
        // "min,max" strings; suggestion/select conditions are arrays. See ListingQueryRequest.
        const fc: Record<string, unknown> = {};
        // NOTE: the `location` suggestion condition only honors ONE key. Sending city +
        // state + zipCode together makes the API silently ignore the whole location
        // filter (returns nationwide results). Prefer city, else zipCode. `state` alone
        // is not a supported location key and is intentionally not sent.
        const loc: Record<string, unknown> = {};
        if (a.city) loc.city = [String(a.city)];
        else if (a.zipCode) loc.zipCode = [String(a.zipCode)];
        if (Object.keys(loc).length) fc.location = loc;
        const range = (min: unknown, max: unknown): string | undefined =>
          min == null && max == null ? undefined : `${min != null ? String(min) : ''},${max != null ? String(max) : ''}`;
        const price = range(a.priceMin, a.priceMax);
        if (price) fc.price = price;
        const sqft = range(a.sqFtMin, a.sqFtMax);
        if (sqft) fc.sqFt = sqft;
        if (a.bedroomsMin != null) fc.beds = `${String(a.bedroomsMin)},`;
        if (a.bathroomsMin != null) fc.baths = `${String(a.bathroomsMin)},`;
        if (a.daysOnSite != null) fc.daysOnSite = `,${String(a.daysOnSite)}`;
        if (a.propertyType) fc.propertyType = [String(a.propertyType)];
        if (a.purchaseType) fc.purchaseType = [String(a.purchaseType)];
        const body: Record<string, unknown> = {
          searchScope: a.searchScope || 'all',
          soldFlag: a.soldFlag === true,
          filterConditions: fc,
          pageNum: a.pageNum || 1,
          pageSize: a.pageSize || a.limit || 25,
        };
        if (a.keyword) body.keyword = String(a.keyword);
        if (a.sort) body.sortFields = [String(a.sort)];
        const data = await loftyRequest('POST', '/v2.0/listings/search', { config, body });
        return JSON.stringify(data, null, 2);
      } catch (e) {
        return formatError(e);
      }
    },
  },
];
