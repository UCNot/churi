import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcdLib } from '../compiler/deserialization/ucd-lib.js';
import { UcDeserializer } from './uc-deserializer.js';
import { UcSchema } from './uc-schema.js';
import { ucUnknown } from './uc-unknown.js';

describe('UcUnknown', () => {
  let lib: UcdLib<{ readValue: UcSchema<unknown> }>;
  let readValue: UcDeserializer<unknown>;

  beforeEach(async () => {
    lib = new UcdLib({ schemae: { readValue: ucUnknown() } });
    ({ readValue } = await lib.compile().toDeserializers());
  });

  it('recognizes boolean', () => {
    expect(readValue('!')).toBe(true);
    expect(readValue('-')).toBe(false);
  });
  it('recognizes bigint', () => {
    expect(readValue('0n123')).toBe(123n);
    expect(readValue('-0n123')).toBe(-123n);
  });
  it('recognizes number', () => {
    expect(readValue('123')).toBe(123);
    expect(readValue('-123')).toBe(-123);
  });
  it('recognizes string', () => {
    expect(readValue('abc')).toBe('abc');
    expect(readValue("'123")).toBe('123');
    expect(readValue('')).toBe('');
  });
  it('recognizes null', () => {
    expect(readValue('--')).toBeNull();
  });
});
