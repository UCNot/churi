import { beforeEach, describe, expect, it } from '@jest/globals';
import { ucModelName } from '../uc-model-name.js';
import { UcList, ucList } from './uc-list.js';

describe('UcList', () => {
  let schema: UcList.Schema<string>;

  beforeEach(() => {
    schema = ucList<string>(String);
  });

  describe('item', () => {
    it('contains item schema', () => {
      expect(schema.item).toEqual({
        optional: false,
        nullable: false,
        type: String,
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
      expect(ucModelName(schema)).toBe('String[]');
    });
  });
});
