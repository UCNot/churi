import { describe, expect, it } from '@jest/globals';
import { EsBundle } from 'esgen';
import { UcsLib } from './ucs-lib.js';

describe('UcsLib', () => {
  it('is not created automatically', () => {
    const bundle = new EsBundle();

    expect(() => bundle.get(UcsLib)).toThrow(new ReferenceError(`UcsLib is not initialized`));
  });
});
