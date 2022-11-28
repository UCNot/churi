import { beforeAll, describe, expect, it } from '@jest/globals';
import { ChURIPrimitive, ChURIValue } from '../ch-uri-value.js';
import { URIChargeParser } from '../uri-charge-parser.js';
import { NullURIChargeFormat } from './null.uri-charge-format.js';

describe('NullURIChargeFormat', () => {
  let parser: URIChargeParser<ChURIPrimitive | null, ChURIValue | null>;

  beforeAll(() => {
    parser = new URIChargeParser<ChURIPrimitive | null, ChURIValue | null>({
      format: NullURIChargeFormat,
    });
  });

  it('recognized top-level `null`', () => {
    expect(parser.parse('!null')).toEqual({ charge: null, end: 5 });
  });
});
