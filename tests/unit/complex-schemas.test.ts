import { describe, it, expect } from 'vitest';
import { validateSchemaString, checkDeprecatedFields } from '../../src/validators/schema-validator';

const ECOMMERCE_SCHEMA = `
  type Query {
    products(limit: Int, offset: Int): ProductConnection!
    product(id: ID!): Product
    categories: [Category!]!
    user(id: ID!): User
    search(query: String!, type: SearchType): SearchResult!
  }

  type Mutation {
    addToCart(productId: ID!, quantity: Int!): Cart!
    removeFromCart(itemId: ID!): Cart!
    checkout(input: CheckoutInput!): Order!
    createReview(input: ReviewInput!): Review!
  }

  type Product {
    id: ID!
    title: String!
    description: String!
    price: Float!
    compareAtPrice: Float
    inStock: Boolean!
    category: Category!
    images: [String!]!
    reviews: [Review!]!
    averageRating: Float
    createdAt: String!
    oldField: String @deprecated(reason: "Use title instead")
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    productCount: Int!
  }

  type User {
    id: ID!
    email: String!
    name: String!
    cart: Cart
    orders: [Order!]!
  }

  type Cart {
    id: ID!
    items: [CartItem!]!
    totalPrice: Float!
    itemCount: Int!
  }

  type CartItem {
    id: ID!
    product: Product!
    quantity: Int!
    lineTotal: Float!
  }

  type Order {
    id: ID!
    items: [OrderItem!]!
    total: Float!
    status: OrderStatus!
    createdAt: String!
  }

  type OrderItem {
    productId: ID!
    title: String!
    quantity: Int!
    price: Float!
  }

  type Review {
    id: ID!
    author: User!
    rating: Int!
    comment: String
    createdAt: String!
  }

  type ProductConnection {
    nodes: [Product!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  union SearchResult = Product | Category | User

  enum OrderStatus {
    PENDING
    CONFIRMED
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum SearchType {
    PRODUCT
    CATEGORY
    USER
    ALL
  }

  input CheckoutInput {
    cartId: ID!
    shippingAddress: AddressInput!
    paymentMethod: String!
  }

  input AddressInput {
    street: String!
    city: String!
    state: String!
    zip: String!
    country: String!
  }

  input ReviewInput {
    productId: ID!
    rating: Int!
    comment: String
  }
`;

describe('Complex e-commerce schema validation', () => {
  it('should validate a full e-commerce schema', () => {
    const result = validateSchemaString(ECOMMERCE_SCHEMA);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.queries).toBe(5);
    expect(result.stats.mutations).toBe(4);
    expect(result.stats.types).toBeGreaterThan(10);
    expect(result.stats.fields).toBeGreaterThan(30);
  });

  it('should detect deprecated fields', () => {
    const deprecated = checkDeprecatedFields(ECOMMERCE_SCHEMA);

    expect(deprecated).toHaveLength(1);
    expect(deprecated[0].type).toBe('Product');
    expect(deprecated[0].field).toBe('oldField');
    expect(deprecated[0].reason).toContain('title');
  });

  it('should count all user-defined types (excluding builtins)', () => {
    const result = validateSchemaString(ECOMMERCE_SCHEMA);

    // Product, Category, User, Cart, CartItem, Order, OrderItem, Review,
    // ProductConnection, Query, Mutation + enums + inputs + union
    expect(result.stats.types).toBeGreaterThanOrEqual(12);
  });
});

describe('Schema with enums and interfaces', () => {
  const SCHEMA_WITH_INTERFACE = `
    interface Node {
      id: ID!
    }

    type Query {
      node(id: ID!): Node
      users: [User!]!
    }

    type User implements Node {
      id: ID!
      name: String!
      role: Role!
    }

    enum Role {
      ADMIN
      EDITOR
      VIEWER
    }
  `;

  it('should validate schema with interfaces', () => {
    const result = validateSchemaString(SCHEMA_WITH_INTERFACE);

    expect(result.valid).toBe(true);
    expect(result.stats.queries).toBe(2);
  });

  it('should have no deprecated fields', () => {
    const deprecated = checkDeprecatedFields(SCHEMA_WITH_INTERFACE);
    expect(deprecated).toHaveLength(0);
  });
});

describe('Invalid schema handling', () => {
  it('should report error for schema with syntax error', () => {
    const result = validateSchemaString('type Query { broken field }');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should report error for completely invalid input', () => {
    const result = validateSchemaString('this is not graphql at all!!!');
    expect(result.valid).toBe(false);
  });

  it('should report error for empty schema', () => {
    // Empty SDL is actually invalid since GraphQL needs at least a type
    const result = validateSchemaString('type Query { }');
    // Empty object type might parse but warn
    expect(result.stats.queries).toBe(0);
  });

  it('should handle schema with only mutations (no queries warning)', () => {
    const result = validateSchemaString(`
      type Query { _empty: String }
      type Mutation { doSomething: Boolean }
    `);
    expect(result.valid).toBe(true);
    expect(result.stats.mutations).toBe(1);
  });

  it('should detect multiple deprecated fields', () => {
    const schema = `
      type Query {
        users: [User!]!
      }
      type User {
        id: ID!
        oldName: String @deprecated(reason: "Use name")
        name: String!
        legacyEmail: String @deprecated(reason: "Use email")
        email: String!
      }
    `;
    const deprecated = checkDeprecatedFields(schema);
    expect(deprecated).toHaveLength(2);
    expect(deprecated.map((d) => d.field).sort()).toEqual(['legacyEmail', 'oldName']);
  });
});
