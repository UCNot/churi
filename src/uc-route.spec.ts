import { describe, expect, it } from '@jest/globals';
import './spec/uri-charge-matchers.js';
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

  describe('name', () => {
    it('is URL-decoded', () => {
      expect(new UcRoute('some%20path').name).toBe('some path');
    });
    it('omits slashes', () => {
      expect(new UcRoute('').name).toBe('');
      expect(new UcRoute('/').name).toBe('');
      expect(new UcRoute('//').name).toBe('');
      expect(new UcRoute('/path').name).toBe('path');
      expect(new UcRoute('/path').name).toBe('path');
      expect(new UcRoute('path/').name).toBe('path');
      expect(new UcRoute('/path/').name).toBe('path');
    });
    it('omits dollar prefix', () => {
      expect(new UcRoute('/$some').name).toBe('some');
      expect(new UcRoute('/$some,other').name).toBe('some');
      expect(new UcRoute('/$some(foo)').name).toBe('some');
    });
    it('omits quote', () => {
      expect(new UcRoute("/'some").name).toBe('some');
      expect(new UcRoute("/'some,other").name).toBe('some');
    });
    it('does not omit quote of entry key', () => {
      expect(new UcRoute("/'some(foo)").name).toBe("'some");
    });
    it('omits charge', () => {
      expect(new UcRoute('name(foo)').name).toBe('name');
      expect(new UcRoute('name(foo);p=bar').name).toBe('name');
    });
    it('omits matrix parameters', () => {
      expect(new UcRoute('name;p=bar').name).toBe('name');
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

  describe('charge', () => {
    it('is string value without charge', () => {
      expect(new UcRoute('/path').charge).toHaveURIChargeValue('path');
    });
    it('recognizes single charge', () => {
      expect(new UcRoute('/path(foo)').charge).toHaveURIChargeItems({ path: 'foo' });
    });
    it('recognizes list charge', () => {
      expect(new UcRoute('/path,foo,bar)').charge).toHaveURIChargeItems('path', 'foo', 'bar');
    });
    it('recognizes map charge', () => {
      expect(new UcRoute('/path(foo)bar(baz)').charge).toHaveURIChargeItems({
        path: 'foo',
        bar: 'baz',
      });
    });
  });

  describe('matrix', () => {
    it('is empty by default', () => {
      const charge = new UcRoute('/path').matrix.charge;

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({});
    });
    it('is empty without parameters', () => {
      const charge = new UcRoute('/path;').matrix.charge;

      expect(charge).toBeURIChargeMap();
      expect(charge).toHaveURIChargeEntries({});
    });
    it('recognizes matrix parameters', () => {
      const charge = new UcRoute('/path;p1=v1(foo);p2=v2').matrix.charge;

      expect(charge).toHaveURIChargeEntries({ p1: { v1: 'foo' }, p2: 'v2' });
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
