import { describe, expect, it } from '@jest/globals';
import { EsBundle } from 'esgen';
import { UcrxLib } from './ucrx-lib.js';

describe('UcrxLib', () => {
  it('is not created automatically', () => {
    const bundle = new EsBundle();

    expect(() => bundle.get(UcrxLib)).toThrow(new ReferenceError(`UcrxLib is not initialized`));
  });
});
