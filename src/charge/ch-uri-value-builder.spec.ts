import { beforeEach, describe, expect, it } from '@jest/globals';
import { ChURIDirectiveBuilder } from './ch-uri-value-builder.js';

describe('ChURIDirectiveBuilder', () => {
  let builder: ChURIDirectiveBuilder;

  beforeEach(() => {
    builder = new ChURIDirectiveBuilder('test');
  });

  describe('endDirective', () => {
    it('builds directive without parameters', () => {
      const { rawName, value } = builder.endDirective();

      expect(rawName).toBe('test');
      expect(value).toEqual({});
    });
  });
});
