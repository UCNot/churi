import { beforeEach, describe, expect, it } from '@jest/globals';
import { PromiseResolver } from '@proc7ts/async';
import { UcdMemory } from './ucd-memory.js';

describe('UcdMemory', () => {
  let memory: UcdMemory;

  beforeEach(() => {
    memory = new UcdMemory(10);
  });

  describe('use', () => {
    it('allocates memory if available', async () => {
      await expect(memory.use(10, buffer => buffer.length)).resolves.toBe(10);
      await expect(memory.use(9, buffer => buffer.length)).resolves.toBe(9);
    });
    it('allocates up to available memory', async () => {
      await expect(memory.use(11, buffer => buffer.length)).resolves.toBe(10);
    });
    it('allocates memory within one block simultaneously', async () => {
      const resolver1 = new PromiseResolver();
      const resolver2 = new PromiseResolver();

      let size1 = -1;
      let size2 = -1;
      const promise1 = memory.use(2, async ({ length }) => {
        size1 = length;
        await resolver1.whenDone();
      });
      const promise2 = memory.use(4, async ({ length }) => {
        size2 = length;
        await resolver2.whenDone();
      });

      await new Promise(resolve => setImmediate(resolve));

      expect(size1).toBe(2);
      expect(size2).toBe(4);

      resolver1.resolve();
      await promise1;

      resolver2.resolve();
      await promise2;
    });
    it('allocates memory in different blocks simultaneously', async () => {
      const resolver1 = new PromiseResolver();
      const resolver2 = new PromiseResolver();

      let size1 = -1;
      let size2 = -1;
      const promise1 = memory.use(10, async ({ length }) => {
        size1 = length;
        await resolver1.whenDone();
      });
      const promise2 = memory.use(8, async ({ length }) => {
        size2 = length;
        await resolver2.whenDone();
      });

      await new Promise(resolve => setImmediate(resolve));

      expect(size1).toBe(10);
      expect(size2).toBe(8);

      resolver1.resolve();
      await promise1;

      resolver2.resolve();
      await promise2;
    });
    it('awaits for free memory', async () => {
      const resolver1 = new PromiseResolver();
      const resolver2 = new PromiseResolver();
      const resolver3 = new PromiseResolver();

      let size1 = -1;
      let size2 = -1;
      let size3 = -1;
      const promise1 = memory.use(12, async ({ length }) => {
        size1 = length;
        await resolver1.whenDone();
      });
      const promise2 = memory.use(13, async ({ length }) => {
        size2 = length;
        await resolver2.whenDone();
      });
      const promise3 = memory.use(1, async ({ length }) => {
        size3 = length;
        await resolver2.whenDone();
      });

      await new Promise(resolve => setImmediate(resolve));

      expect(size1).toBe(10);
      expect(size2).toBe(10);
      expect(size3).toBe(-1);

      resolver1.resolve();
      await promise1;

      await new Promise(resolve => setImmediate(resolve));

      expect(size3).toBe(1);

      resolver2.resolve();
      await promise2;

      resolver3.resolve();
      await promise3;
    });
  });
});
