import { beforeEach, describe, expect, it } from '@jest/globals';
import { SingleUcAttr } from './single.uc-attr.js';
import { UcMetaAttr } from './uc-meta-attr.js';
import { UcMeta } from './uc-meta.js';

describe('SingleUcAttr', () => {
  let meta: UcMeta;
  let attr: UcMetaAttr<number>;

  beforeEach(() => {
    meta = new UcMeta();
    attr = new SingleUcAttr<number>('test');
  });

  it('is identified by uid', () => {
    const attr1 = new SingleUcAttr('attr1');
    const attr2 = new SingleUcAttr('attr2', attr1);
    const attr3 = new SingleUcAttr('attr3', 'attr3');

    meta.add(attr1, 1).add(attr2, 2).add(attr3, 3);

    expect(meta.get(attr1)).toBe(2);
    expect(meta.get(attr2)).toBe(2);
    expect(meta.get(attr3)).toBe(3);
    expect(meta.get('attr3')).toBe(3);
    expect([...meta.attributes()]).toEqual([attr1, attr3]);
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
    it('extracts single value', () => {
      meta.add(attr, 1).add(attr, 2).add(attr, 3);

      expect(meta.getAll(attr)).toEqual([3]);
    });
    it('extracts empty array when missing', () => {
      expect(meta.getAll(attr)).toEqual([]);
    });
  });

  describe('clone', () => {
    it('copies the value when meta merged', () => {
      meta.add(attr, 1);

      const meta2 = new UcMeta().addAll(meta);

      expect(meta2.get(attr)).toBe(1);
    });
    it('copies the value when meta cloned', () => {
      meta.add(attr, 1);

      const meta2 = meta.clone().add('test', 2);

      expect(meta2.get(attr)).toBe(1);
    });
  });

  describe('merge', () => {
    it('takes the last value', () => {
      meta.add(attr, 1);

      const meta2 = new UcMeta().add(attr, 2);

      expect(meta.addAll(meta2).get(attr)).toBe(2);
    });
  });
});
