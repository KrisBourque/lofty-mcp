import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listing } from '../../src/tools/listing.js';
import {
  TEST_CONFIG,
  MOCK_DATA,
  mockFetchSuccess,
  mockFetchError,
  parseLastFetchCall,
  expectError,
} from '../helpers.js';

function getTool(name: string) {
  const tool = listing.find(t => t.name === name);
  if (!tool) throw new Error(`Tool not found: ${name}`);
  return tool;
}

describe('listing tools', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getPublishedListings', () => {
    it('exports 3 tools', () => {
      expect(listing).toHaveLength(3);
    });

    it('calls GET /v1.0/getPublishedListings', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('getPublishedListings');
      const result = await tool.handler({}, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/getPublishedListings');
      expect(JSON.parse(result)).toEqual(MOCK_DATA);
    });

    it('passes siteId, page, pageSize as query params', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('getPublishedListings');
      await tool.handler({ siteId: 'site-1', page: 2, pageSize: 10 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.params.siteId).toBe('site-1');
      expect(call.params.page).toBe('2');
      expect(call.params.pageSize).toBe('10');
    });

    it('works with no params', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('getPublishedListings');
      await tool.handler({}, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.pathname).toBe('/v1.0/getPublishedListings');
      expect(Object.keys(call.params)).toHaveLength(0);
    });

    it('returns formatted error on API failure', async () => {
      mockFetchError(404);
      const tool = getTool('getPublishedListings');
      const result = await tool.handler({}, TEST_CONFIG);
      expectError(result, 404);
    });
  });

  describe('getListingsByAgent', () => {
    it('calls GET /v1.0/listing', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('getListingsByAgent');
      const result = await tool.handler({}, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.method).toBe('GET');
      expect(call.pathname).toBe('/v1.0/listing');
      expect(JSON.parse(result)).toEqual(MOCK_DATA);
    });

    it('passes agentId as query param', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('getListingsByAgent');
      await tool.handler({ agentId: 42 }, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.params.agentId).toBe('42');
    });

    it('returns formatted error on 401', async () => {
      mockFetchError(401);
      const tool = getTool('getListingsByAgent');
      const result = await tool.handler({ agentId: 1 }, TEST_CONFIG);
      expectError(result, 401);
    });
  });

  describe('searchListingsV2', () => {
    it('calls POST /v2.0/listings/search', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('searchListingsV2');
      const result = await tool.handler({}, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.method).toBe('POST');
      expect(call.pathname).toBe('/v2.0/listings/search');
      expect(JSON.parse(result)).toEqual(MOCK_DATA);
    });

    it('maps flat filters into the ListingQueryRequest filterConditions structure', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('searchListingsV2');
      const body = {
        keyword: 'downtown',
        priceMin: 200000,
        priceMax: 500000,
        bedroomsMin: 2,
        bathroomsMin: 1,
        propertyType: 'Single Family Home',
        purchaseType: 'For Sale',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        limit: 20,
        sort: 'PRICE_ASC',
      };
      await tool.handler(body, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.body).toEqual({
        searchScope: 'all',
        soldFlag: false,
        filterConditions: {
          // only `city` is sent — see handler note: multi-key location is ignored by the API
          location: { city: ['Austin'] },
          price: '200000,500000',
          beds: '2,',
          baths: '1,',
          propertyType: ['Single Family Home'],
          purchaseType: ['For Sale'],
        },
        pageNum: 1,
        pageSize: 20,
        keyword: 'downtown',
        sortFields: ['PRICE_ASC'],
      });
    });

    it('works with empty body (sends sane defaults)', async () => {
      const fetchMock = mockFetchSuccess(MOCK_DATA);
      const tool = getTool('searchListingsV2');
      await tool.handler({}, TEST_CONFIG);
      const call = parseLastFetchCall(fetchMock);
      expect(call.method).toBe('POST');
      expect(call.body).toEqual({
        searchScope: 'all',
        soldFlag: false,
        filterConditions: {},
        pageNum: 1,
        pageSize: 25,
      });
    });

    it('returns formatted error on 500', async () => {
      mockFetchError(500);
      const tool = getTool('searchListingsV2');
      const result = await tool.handler({ city: 'Austin' }, TEST_CONFIG);
      expectError(result, 500);
    });
  });
});
