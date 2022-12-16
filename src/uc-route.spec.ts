import { describe, expect, it } from '@jest/globals';
import { UcRoute } from './uc-route.js';

describe('UcRoute', () => {
  describe('fullPath', () => {
    it('contains the path passed to constructor', () => {
      expect(new UcRoute('some/path').fullPath).toBe('some/path');
      expect(new UcRoute('/some/path').fullPath).toBe('/some/path');
      expect(new UcRoute('').fullPath).toBe('');
      expect(new UcRoute('/').fullPath).toBe('/');
    });
  });

  describe('fragment', () => {
    it('is empty for empty path', () => {
      expect(new UcRoute('').fragment).toBe('');
    });
    it('contains leading slash', () => {
      expect(new UcRoute('/some').fragment).toBe('/some');
      expect(new UcRoute('/').fragment).toBe('/');
      expect(new UcRoute('/some/path').fragment).toBe('/some');
    });
    it('contains trailing slash', () => {
      expect(new UcRoute('/some/').fragment).toBe('/some/');
      expect(new UcRoute('//').fragment).toBe('//');
      expect(new UcRoute('/some/path/').get(1)?.fragment).toBe('path/');
    });
    it('is URL-decoded', () => {
      expect(new UcRoute('/some%20path').fragment).toBe('/some path');
    });
  });

  describe('path', () => {
    it('strips `.` fragments', () => {
      expect(new UcRoute('.').path).toBe('');
      expect(new UcRoute('./').path).toBe('/');
      expect(new UcRoute('/.').path).toBe('/');
      expect(new UcRoute('/./').path).toBe('/');

      expect(new UcRoute('./some/./path/./').path).toBe('some/path/');
      expect(new UcRoute('./some/./path/.').path).toBe('some/path/');
      expect(new UcRoute('/./some/./path/.').path).toBe('/some/path/');
      expect(new UcRoute('/./some/./path/./').path).toBe('/some/path/');

      expect(new UcRoute('some/././path/./').path).toBe('some/path/');
      expect(new UcRoute('some/././path/.').path).toBe('some/path/');
      expect(new UcRoute('/some/././path/.').path).toBe('/some/path/');
      expect(new UcRoute('/some/././path/./').path).toBe('/some/path/');
    });
    it('handles `..` fragments', () => {
      expect(new UcRoute('some/../path').path).toBe('path');
      expect(new UcRoute('some/../path/').path).toBe('path/');
      expect(new UcRoute('/some/../path').path).toBe('/path');
      expect(new UcRoute('/some/../path').path).toBe('/path');

      expect(new UcRoute('some/long/../path').path).toBe('some/path');
      expect(new UcRoute('some/long/../path/').path).toBe('some/path/');
      expect(new UcRoute('/some/long/../path').path).toBe('/some/path');
      expect(new UcRoute('/some/long/../path/').path).toBe('/some/path/');

      expect(new UcRoute('some/very/long/../../path').path).toBe('some/path');
      expect(new UcRoute('some/very/long/../../path/').path).toBe('some/path/');
      expect(new UcRoute('/some/very/long/../../path').path).toBe('/some/path');
      expect(new UcRoute('/some/very/long/../../path/').path).toBe('/some/path/');
    });
    it('handles leading `..` fragments', () => {
      expect(new UcRoute('..').path).toBe('');
      expect(new UcRoute('../').path).toBe('/');
      expect(new UcRoute('/..').path).toBe('/');
      expect(new UcRoute('/../').path).toBe('/');

      expect(new UcRoute('../some').path).toBe('some');
      expect(new UcRoute('../some/').path).toBe('some/');
      expect(new UcRoute('/../some').path).toBe('/some');
      expect(new UcRoute('/../some/').path).toBe('/some/');
    });
    it('handles trailing `..` fragments', () => {
      expect(new UcRoute('some/..').path).toBe('');
      expect(new UcRoute('some/../').path).toBe('/');
      expect(new UcRoute('/some/..').path).toBe('/');
      expect(new UcRoute('/some/../').path).toBe('/');

      expect(new UcRoute('some/long/..').path).toBe('some');
      expect(new UcRoute('some/long/../').path).toBe('some/');
      expect(new UcRoute('/some/long/..').path).toBe('/some');
      expect(new UcRoute('/some/long/../').path).toBe('/some/');
    });
    it('is shorted for sub-route', () => {
      expect(new UcRoute('some/long/path').get(1)?.path).toBe('long/path');
      expect(new UcRoute('some/long/path/').get(1)?.path).toBe('long/path/');
      expect(new UcRoute('/some/long/path').get(1)?.path).toBe('long/path');
      expect(new UcRoute('/some/long/path/').get(1)?.path).toBe('long/path/');
    });
    it('is not URL-decoded', () => {
      expect(new UcRoute('/some%20path').path).toBe('/some%20path');
    });
  });

  describe('get', () => {
    it('returns itself for index 0', () => {
      const route = new UcRoute('some/path');

      expect(route).toHaveLength(2);
      expect(route.get(0)).toBe(route);
      expect(route.fragment).toBe('some');
    });
    it('returns next fragment for index 1', () => {
      const route = new UcRoute('some/path');

      expect(route).toHaveLength(2);
      expect(route.index).toBe(0);

      const subRoute = route.get(1);

      expect(subRoute).toHaveLength(2);
      expect(subRoute?.fragment).toBe('path');
    });
    it('returns previous fragment', () => {
      const route = new UcRoute('some/path');

      expect(route.get(1)?.get(-1)).toBe(route);
    });
    it('returns nothing for invalid indices', () => {
      const route = new UcRoute('/some/path');

      expect(route.get(-1)).toBeUndefined();
      expect(route.get(2)).toBeUndefined();
      expect(route.get(0.1)).toBeUndefined();
      expect(route.get('length' as unknown as number)).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('reflects path', () => {
      expect(String(new UcRoute('some/long/path'))).toBe('some/long/path');
      expect(String(new UcRoute('some/long/path').get(1))).toBe('long/path');
    });
  });

  describe('toJSON', () => {
    it('reflects path', () => {
      expect(JSON.stringify(new UcRoute('some/long/path'))).toBe('"some/long/path"');
      expect(JSON.stringify(new UcRoute('some/long/path').get(1))).toBe('"long/path"');
    });
  });
});
