import { beforeEach, describe, expect, it } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { UcdLib } from '../../compiler/deserialization/ucd-lib.js';
import { UcsLib } from '../../compiler/serialization/ucs-lib.js';
import { UnsupportedUcSchemaError } from '../../compiler/unsupported-uc-schema.error.js';
import { parseTokens, readTokens } from '../../spec/read-chunks.js';
import { TextOutStream } from '../../spec/text-out-stream.js';
import { ucMap } from '../map/uc-map.js';
import { UcDeserializer } from '../uc-deserializer.js';
import { UcError, UcErrorInfo } from '../uc-error.js';
import { UcNullable, ucNullable } from '../uc-nullable.js';
import { ucOptional } from '../uc-optional.js';
import { ucSchemaName } from '../uc-schema-name.js';
import { UcSchemaResolver } from '../uc-schema-resolver.js';
import { UcSchema, ucSchemaRef } from '../uc-schema.js';
import { UcSerializer } from '../uc-serializer.js';
import { UcList, ucList } from './uc-list.js';

describe('UcList', () => {
  const spec = ucList<string>(ucSchemaRef<string>(() => String));

  let resolver: UcSchemaResolver;
  let schema: UcList.Schema<string>;

  beforeEach(() => {
    resolver = new UcSchemaResolver();
    schema = resolver.schemaOf(spec);
  });

  describe('item', () => {
    it('contains item schema', () => {
      expect(resolver.schemaOf(spec).item).toEqual({
        optional: false,
        nullable: false,
        type: String,
        asis,
      });
    });
  });

  describe('type', () => {
    it('is set to `list`', () => {
      expect(schema.type).toBe('list');
    });
  });

  describe('name', () => {
    it('reflects item type', () => {
      expect(ucSchemaName(schema)).toBe('String[]');
    });
  });
});
