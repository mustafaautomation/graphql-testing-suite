import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GraphQLClient, GraphQLResponse } from '../../src/client/graphql-client';

// Mock fetch globally
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockJsonResponse(body: GraphQLResponse, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => ({}) as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(''),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

describe('GraphQLClient', () => {
  const client = new GraphQLClient({ url: 'https://api.example.com/graphql' });

  describe('query', () => {
    it('should send a POST request with query', async () => {
      const responseBody: GraphQLResponse = {
        data: { users: [{ id: '1', name: 'Alice' }] },
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(responseBody));

      const result = await client.query('{ users { id name } }');

      expect(mockFetch).toHaveBeenCalledOnce();
      expect(result.data).toEqual(responseBody.data);
      expect(result.errors).toBeUndefined();

      // Verify request body
      const [, options] = mockFetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.query).toBe('{ users { id name } }');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('should pass variables to the request', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: { user: { id: '1' } } }));

      await client.query('query GetUser($id: ID!) { user(id: $id) { id } }', {
        id: '1',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables).toEqual({ id: '1' });
    });

    it('should return errors from GraphQL response', async () => {
      const responseBody: GraphQLResponse = {
        errors: [{ message: 'Field "xyz" not found on type "Query"' }],
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(responseBody));

      const result = await client.query('{ xyz }');

      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].message).toContain('xyz');
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}, 500));

      await expect(client.query('{ users { id } }')).rejects.toThrow('GraphQL request failed: 500');
    });
  });

  describe('mutation', () => {
    it('should send mutation request', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse({
          data: { createUser: { id: '10', name: 'New User' } },
        }),
      );

      const result = await client.mutation(
        'mutation CreateUser($name: String!) { createUser(name: $name) { id name } }',
        { name: 'New User' },
      );

      expect(result.data).toBeDefined();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.variables.name).toBe('New User');
    });
  });

  describe('introspect', () => {
    it('should send introspection query', async () => {
      mockFetch.mockResolvedValueOnce(
        mockJsonResponse({
          data: {
            __schema: {
              queryType: { name: 'Query' },
              types: [],
            },
          },
        }),
      );

      const result = await client.introspect();

      expect(result.data).toBeDefined();
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.query).toContain('IntrospectionQuery');
      expect(body.query).toContain('__schema');
    });
  });

  describe('headers', () => {
    it('should include custom headers', async () => {
      const authedClient = new GraphQLClient({
        url: 'https://api.example.com/graphql',
        headers: { Authorization: 'Bearer test-token' },
      });

      mockFetch.mockResolvedValueOnce(mockJsonResponse({ data: {} }));
      await authedClient.query('{ me { id } }');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });
});
