import { describe, it, expect } from 'vitest';
import { validateSchemaString, checkDeprecatedFields } from '../../src/validators/schema-validator';

const VALID_SCHEMA = `
  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
  }

  type User {
    id: ID!
    name: String!
    email: String!
  }
`;

describe('validateSchemaString', () => {
  it('should validate a correct schema', () => {
    const result = validateSchemaString(VALID_SCHEMA);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should report stats correctly', () => {
    const result = validateSchemaString(VALID_SCHEMA);
    expect(result.stats.queries).toBe(2);
    expect(result.stats.mutations).toBe(1);
    expect(result.stats.types).toBeGreaterThan(0);
  });

  it('should fail on invalid SDL', () => {
    const result = validateSchemaString('this is not valid graphql');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about missing descriptions', () => {
    const result = validateSchemaString(VALID_SCHEMA);
    expect(result.warnings.some((w) => w.includes('no description'))).toBe(true);
  });

  it('should warn when no mutations defined', () => {
    const result = validateSchemaString('type Query { ping: String }');
    expect(result.warnings.some((w) => w.includes('no mutation'))).toBe(true);
  });
});

describe('checkDeprecatedFields', () => {
  it('should find deprecated fields', () => {
    const schema = `
      type Query {
        users: [User]
      }
      type User {
        id: ID!
        name: String!
        legacyId: String @deprecated(reason: "Use id instead")
      }
    `;
    const deprecated = checkDeprecatedFields(schema);
    expect(deprecated).toHaveLength(1);
    expect(deprecated[0].field).toBe('legacyId');
    expect(deprecated[0].reason).toContain('Use id');
  });

  it('should return empty for no deprecated fields', () => {
    const deprecated = checkDeprecatedFields(VALID_SCHEMA);
    expect(deprecated).toHaveLength(0);
  });
});
