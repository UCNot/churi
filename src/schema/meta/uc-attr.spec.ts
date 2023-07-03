import { beforeEach, describe, expect, it } from '@jest/globals';
import { UcAttr } from './uc-attr.js';
import { UcMetaAttr } from './uc-meta-attr.js';
import { UcMeta } from './uc-meta.js';

describe('UcAttr', () => {
  let meta: UcMeta;
  let attr: UcMetaAttr<number>;

  beforeEach(() => {
    meta = new UcMeta();
    attr = new UcAttr<number>('test');
  });

  describe('extract', () => {
    it('extracts the last value', () => {
      meta.add(attr, 1).add(attr, 2).add(attr, 3);

      expect(meta.get(attr)).toBe(3);
    });
    it('extracts nothing when missing', () => {
      expect(meta.get(attr)).toBeUndefined();
    });
  });

  describe('extractAll', () => {
    it('extracts all values', () => {
      meta.add(attr, 1).add(attr, 2).add(attr, 3);

      expect(meta.getAll(attr)).toEqual([1, 2, 3]);
    });
    it('extracts empty array when missing', () => {
      expect(meta.getAll(attr)).toEqual([]);
    });
  });

  describe('clone', () => {
    it('copies values when meta merged', () => {
      meta.add(attr, 1).add(attr, 2);

      const meta2 = new UcMeta().addAll(meta);

      expect(meta2.getAll(attr)).toEqual([1, 2]);
    });
    it('copies values when meta cloned', () => {
      meta.add(attr, 1).add(attr, 2);

      const meta2 = meta.clone().add('test', 2);

      expect(meta2.getAll(attr)).toEqual([1, 2]);
    });
  });

  describe('merge', () => {
    it('concatenates values', () => {
      meta.add(attr, 1).add(attr, 2);

      const meta2 = new UcMeta().add(attr, 3).add(attr, 4);

      expect(meta.addAll(meta2).getAll(attr)).toEqual([1, 2, 3, 4]);
    });
  });
});
