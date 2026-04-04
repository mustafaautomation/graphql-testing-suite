# GraphQL Testing Suite

[![CI](https://github.com/mustafaautomation/graphql-testing-suite/actions/workflows/ci.yml/badge.svg)](https://github.com/mustafaautomation/graphql-testing-suite/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098.svg?logo=graphql&logoColor=white)](https://graphql.org)

GraphQL API testing framework with schema validation, response assertions, introspection analysis, and deprecation checking. Works with any GraphQL endpoint.

---

## Features

| Feature | What It Does |
|---------|-------------|
| **Schema Validation** | Validate SDL syntax, count types/queries/mutations, detect missing descriptions |
| **Deprecation Check** | Find all deprecated fields with reasons |
| **Response Assertions** | assertNoErrors, assertFieldExists, assertFieldEquals, assertArrayLength |
| **GraphQL Client** | Type-safe query/mutation/introspection with configurable headers and timeout |
| **Error Assertions** | assertErrorContains for testing error responses |

---

## Quick Start

```typescript
import {
  GraphQLClient,
  validateSchemaString,
  assertNoErrors,
  assertFieldExists,
  assertArrayLength,
} from 'graphql-testing-suite';

// Schema validation
const result = validateSchemaString(mySchema);
expect(result.valid).toBe(true);
expect(result.stats.queries).toBeGreaterThan(0);

// API testing
const client = new GraphQLClient({ url: 'https://api.example.com/graphql' });
const response = await client.query('{ users { id name } }');
expect(assertNoErrors(response).passed).toBe(true);
expect(assertFieldExists(response, 'users').passed).toBe(true);
expect(assertArrayLength(response, 'users', 10).passed).toBe(true);
```

---

## Response Assertions

| Assertion | Description |
|-----------|-------------|
| `assertNoErrors(res)` | Verify no GraphQL errors |
| `assertHasData(res)` | Verify data field exists |
| `assertFieldExists(res, 'path')` | Check nested field exists |
| `assertFieldEquals(res, 'path', value)` | Check field equals expected |
| `assertArrayLength(res, 'path', n)` | Check array has length n |
| `assertErrorContains(res, 'text')` | Check error message contains text |

All assertions return `{ passed: boolean, message: string }`.

---

## Project Structure

```
graphql-testing-suite/
├── src/
│   ├── client/graphql-client.ts      # GraphQL HTTP client with introspection
│   ├── validators/
│   │   ├── schema-validator.ts       # SDL validation + stats + deprecation
│   │   └── response-validator.ts     # 6 response assertion functions
│   └── index.ts
├── tests/unit/
│   ├── schema-validator.test.ts      # 7 tests
│   └── response-validator.test.ts    # 12 tests
└── .github/workflows/ci.yml
```

---

## License

MIT

---

Built by [Quvantic](https://quvantic.com)
