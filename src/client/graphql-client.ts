export interface GraphQLResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
}

export interface GraphQLClientConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class GraphQLClient {
  private config: GraphQLClientConfig;

  constructor(config: GraphQLClientConfig) {
    this.config = config;
  }

  async query<T = Record<string, unknown>>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResponse<T>> {
    return this.execute<T>(query, variables);
  }

  async mutation<T = Record<string, unknown>>(
    mutation: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResponse<T>> {
    return this.execute<T>(mutation, variables);
  }

  async introspect(): Promise<GraphQLResponse> {
    return this.execute(INTROSPECTION_QUERY);
  }

  private async execute<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<GraphQLResponse<T>> {
    const res = await fetch(this.config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!res.ok) {
      throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as GraphQLResponse<T>;
  }
}

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
            ofType { name kind }
          }
          args {
            name
            type { name kind ofType { name kind } }
          }
        }
      }
    }
  }
`;
