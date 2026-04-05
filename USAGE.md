## Real-World Use Cases

### 1. Schema Validation in CI
```typescript
const result = validateSchemaString(fs.readFileSync("schema.graphql", "utf-8"));
expect(result.valid).toBe(true);
expect(result.stats.queries).toBeGreaterThan(0);
```

### 2. API Response Testing
```typescript
const client = new GraphQLClient({ url: "https://api.example.com/graphql" });
const res = await client.query("{ users { id name } }");
expect(assertNoErrors(res).passed).toBe(true);
expect(assertArrayLength(res, "users", 10).passed).toBe(true);
```

### 3. Deprecation Monitoring
```typescript
const deprecated = checkDeprecatedFields(schema);
if (deprecated.length > 0) {
  console.warn("Deprecated fields found:", deprecated);
}
```
