import { describe, expect, it } from '@jest/globals';
import { ucModelName } from './uc-model-name.js';
import { ucNullable } from './uc-nullable.js';
import { ucOptional } from './uc-optional.js';

describe('ucModelName', () => {
  it('reflects type name', () => {
    expect(ucModelName({ type: 'test-type' })).toBe('test-type');
  });
  it('reflects class name', () => {
    class TestValue {}

    expect(ucModelName({ type: TestValue })).toBe('TestValue');
  });
  it('reflects optional type', () => {
    expect(ucModelName(ucOptional({ type: 'test-type' }))).toBe('test-type?');
  });
  it('reflects nullable type', () => {
    expect(ucModelName(ucNullable({ type: 'test-type' }))).toBe('(test-type | null)');
  });
  it('reflects optional and nullable type', () => {
    expect(ucModelName(ucOptional(ucNullable({ type: 'test-type' })))).toBe('(test-type | null)?');
  });
});
