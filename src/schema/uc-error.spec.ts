import { describe, expect, it } from '@jest/globals';
import { UcError, UcErrorInfo } from './uc-error.js';

describe('UcError', () => {
  describe('create', () => {
    it('returns UcError as is', () => {
      const error = new UcError({ code: 'some', path: [{}, { key: 'foo' }] });

      expect(UcError.create(error)).toBe(error);
    });
    it('uses arbitrary error as cause', () => {
      const cause = new TypeError('Test!');
      const error = UcError.create(cause);

      expect(error).toBeInstanceOf(UcError);
      expect(error).toMatchObject({
        code: 'error',
        message: cause.message,
        cause,
      });
    });
    it('wraps error info', () => {
      const info: UcErrorInfo = {
        code: 'test',
        path: [{}, { key: 'foo' }],
        details: {
          some: 'value',
        },
        message: 'test message',
      };
      const error = UcError.create(info);

      expect(error).toBeInstanceOf(UcError);
      expect(error).toMatchObject(info as unknown as Record<string, unknown>);
    });
    it('wraps partial error info', () => {
      const info: UcErrorInfo = {
        code: 'test',
        path: [{}, { key: 'foo' }],
      };
      const error = UcError.create(info);

      expect(error).toBeInstanceOf(UcError);
      expect(error).toMatchObject({
        code: 'test',
        message: 'Unexpected error',
        details: {},
      });
    });
    it('does not wrap non-error info', () => {
      expect(UcError.create({ code: 1, message: 'test' })).toMatchObject({
        code: 'error',
        details: {},
        message: 'Unexpected error',
        cause: { code: 1, message: 'test' },
      });
      expect(UcError.create({ code: 'test', message: 13 })).toMatchObject({
        code: 'error',
        message: 'Unexpected error',
        cause: { code: 'test', message: 13 },
      });
      expect(UcError.create({ code: 'test', details: 'some' })).toMatchObject({
        code: 'error',
        message: 'Unexpected error',
        cause: { code: 'test', details: 'some' },
      });
    });
    it('uses string as cause', () => {
      const cause = 'Test!';
      const error = UcError.create(cause);

      expect(error).toBeInstanceOf(UcError);
      expect(error).toMatchObject({
        code: 'error',
        message: cause,
      });
    });
    it('uses arbitrary value as cause', () => {
      const cause = 13;
      const error = UcError.create(cause);

      expect(error).toBeInstanceOf(UcError);
      expect(error).toMatchObject({
        code: 'error',
        message: 'Unexpected error',
        cause,
      });
    });
  });

  describe('toJSON', () => {
    it('returns error info', () => {
      const info: UcErrorInfo = {
        code: 'test',
        path: [{}, { key: 'foo' }],
        details: {
          foo: 'bar',
        },
        message: 'Some message',
        cause: 'Because',
      };

      expect(new UcError(info).toJSON()).toEqual(info);
    });
  });
});
