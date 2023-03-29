import { describe, expect, it } from '@jest/globals';
import { ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';
import { ucSchemaName } from './uc-schema-name.js';

describe('ucSchemaName', () => {
  it('reflects type name', () => {
    expect(ucSchemaName({ type: 'test-type' })).toBe('test-type');
  });
  it('reflects class name', () => {
    class TestValue {}

    expect(ucSchemaName({ type: TestValue })).toBe('TestValue');
  });
  it('reflects optional type', () => {
    expect(ucSchemaName(ucOptional({ type: 'test-type' }))).toBe('test-type?');
  });
  it('reflects nullable type', () => {
    expect(ucSchemaName(ucNullable({ type: 'test-type' }))).toBe('(test-type | null)');
  });
  it('reflects optional and nullable type', () => {
    expect(ucSchemaName(ucOptional(ucNullable({ type: 'test-type' })))).toBe('(test-type | null)?');
  });
});
