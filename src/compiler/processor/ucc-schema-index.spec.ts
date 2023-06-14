import { beforeEach, describe, expect, it } from '@jest/globals';
import { ucBoolean } from '../../schema/boolean/uc-boolean.js';
import { ucBigInt } from '../../schema/numeric/uc-bigint.js';
import { ucNumber } from '../../schema/numeric/uc-number.js';
import { ucMin } from '../../schema/numeric/uc-numeric-range.validator.js';
import { ucString } from '../../schema/string/uc-string.js';
import { ucNullable } from '../../schema/uc-nullable.js';
import { ucOptional } from '../../schema/uc-optional.js';
import { UccSchemaIndex } from './ucc-schema-index.js';

describe('UccSchemaIndex', () => {
  let index: UccSchemaIndex;

  beforeEach(() => {
    index = new UccSchemaIndex(['deserializer', 'validator']);
  });

  it('uses stable IDs for primitives', () => {
    expect(index.schemaId({ type: Boolean })).toBe(index.schemaId(ucBoolean()));
    expect(index.schemaId({ type: BigInt })).toBe(index.schemaId(ucBigInt()));
    expect(index.schemaId({ type: Number })).toBe(index.schemaId(ucNumber()));
    expect(index.schemaId({ type: String })).toBe(index.schemaId(ucString()));
  });
  it('provides different IDs for same-named types', () => {
    expect(index.schemaId({ type: Number })).not.toBe(index.schemaId({ type: 'Number' }));
  });
  it('provides different IDs for types with different constraints', () => {
    expect(index.schemaId(ucNumber({ where: ucMin(0) }))).not.toBe(index.schemaId(ucNumber()));
    expect(index.schemaId(ucBigInt())).not.toBe(index.schemaId(ucBigInt({ where: ucMin(0) })));
  });
  it('provides different IDs for nullable and non-nullable types', () => {
    expect(index.schemaId(ucNullable(ucNumber()))).not.toBe(index.schemaId(ucNumber()));
  });
  it('provides different IDs for optional and required types', () => {
    expect(index.schemaId(ucOptional(ucNumber()))).not.toBe(index.schemaId(ucNumber()));
  });
});
