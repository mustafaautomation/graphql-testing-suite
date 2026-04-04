import { describe, it, expect } from 'vitest';
import {
  assertNoErrors,
  assertHasData,
  assertFieldExists,
  assertFieldEquals,
  assertArrayLength,
  assertErrorContains,
} from '../../src/validators/response-validator';

const goodResponse = {
  data: {
    users: [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' },
    ],
    user: { id: '1', name: 'Alice' },
  },
};

const errorResponse = {
  errors: [{ message: 'User not found' }],
};

describe('assertNoErrors', () => {
  it('should pass when no errors', () => {
    expect(assertNoErrors(goodResponse).passed).toBe(true);
  });

  it('should fail when errors exist', () => {
    expect(assertNoErrors(errorResponse).passed).toBe(false);
  });
});

describe('assertHasData', () => {
  it('should pass when data exists', () => {
    expect(assertHasData(goodResponse).passed).toBe(true);
  });

  it('should fail when no data', () => {
    expect(assertHasData(errorResponse).passed).toBe(false);
  });
});

describe('assertFieldExists', () => {
  it('should find top-level field', () => {
    expect(assertFieldExists(goodResponse, 'users').passed).toBe(true);
  });

  it('should find nested field', () => {
    expect(assertFieldExists(goodResponse, 'user.name').passed).toBe(true);
  });

  it('should fail for missing field', () => {
    expect(assertFieldExists(goodResponse, 'missing').passed).toBe(false);
  });
});

describe('assertFieldEquals', () => {
  it('should match string value', () => {
    expect(assertFieldEquals(goodResponse, 'user.name', 'Alice').passed).toBe(true);
  });

  it('should fail on mismatch', () => {
    expect(assertFieldEquals(goodResponse, 'user.name', 'Bob').passed).toBe(false);
  });
});

describe('assertArrayLength', () => {
  it('should match array length', () => {
    expect(assertArrayLength(goodResponse, 'users', 2).passed).toBe(true);
  });

  it('should fail on wrong length', () => {
    expect(assertArrayLength(goodResponse, 'users', 5).passed).toBe(false);
  });

  it('should fail on non-array', () => {
    expect(assertArrayLength(goodResponse, 'user', 1).passed).toBe(false);
  });
});

describe('assertErrorContains', () => {
  it('should find matching error', () => {
    expect(assertErrorContains(errorResponse, 'not found').passed).toBe(true);
  });

  it('should fail when no errors', () => {
    expect(assertErrorContains(goodResponse, 'anything').passed).toBe(false);
  });

  it('should fail when no match', () => {
    expect(assertErrorContains(errorResponse, 'timeout').passed).toBe(false);
  });
});
