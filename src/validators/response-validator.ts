import { GraphQLResponse } from '../client/graphql-client';

export interface ResponseAssertion {
  passed: boolean;
  message: string;
}

export function assertNoErrors(response: GraphQLResponse): ResponseAssertion {
  if (response.errors && response.errors.length > 0) {
    return {
      passed: false,
      message: `Expected no errors, got ${response.errors.length}: ${response.errors.map((e) => e.message).join(', ')}`,
    };
  }
  return { passed: true, message: 'No errors' };
}

export function assertHasData(response: GraphQLResponse): ResponseAssertion {
  if (!response.data) {
    return { passed: false, message: 'Response has no data field' };
  }
  return { passed: true, message: 'Data present' };
}

export function assertFieldExists(response: GraphQLResponse, path: string): ResponseAssertion {
  const value = getNestedValue(response.data, path);
  if (value === undefined) {
    return { passed: false, message: `Field "${path}" not found in response data` };
  }
  return { passed: true, message: `Field "${path}" exists` };
}

export function assertFieldEquals(
  response: GraphQLResponse,
  path: string,
  expected: unknown,
): ResponseAssertion {
  const value = getNestedValue(response.data, path);
  if (value === undefined) {
    return { passed: false, message: `Field "${path}" not found` };
  }
  if (JSON.stringify(value) !== JSON.stringify(expected)) {
    return {
      passed: false,
      message: `Field "${path}": expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`,
    };
  }
  return { passed: true, message: `Field "${path}" equals expected value` };
}

export function assertArrayLength(
  response: GraphQLResponse,
  path: string,
  expectedLength: number,
): ResponseAssertion {
  const value = getNestedValue(response.data, path);
  if (!Array.isArray(value)) {
    return { passed: false, message: `Field "${path}" is not an array` };
  }
  if (value.length !== expectedLength) {
    return {
      passed: false,
      message: `Array "${path}": expected length ${expectedLength}, got ${value.length}`,
    };
  }
  return { passed: true, message: `Array "${path}" has length ${expectedLength}` };
}

export function assertErrorContains(
  response: GraphQLResponse,
  substring: string,
): ResponseAssertion {
  if (!response.errors || response.errors.length === 0) {
    return { passed: false, message: 'Expected errors but got none' };
  }
  const hasMatch = response.errors.some((e) => e.message.includes(substring));
  if (!hasMatch) {
    return {
      passed: false,
      message: `No error contains "${substring}". Errors: ${response.errors.map((e) => e.message).join(', ')}`,
    };
  }
  return { passed: true, message: `Error contains "${substring}"` };
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
