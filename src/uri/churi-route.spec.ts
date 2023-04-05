import { describe, expect, it } from '@jest/globals';
import '../spec/uri-charge-matchers.js';
import { ChURIRoute } from './churi-route.js';

describe('ChURIRoute', () => {
  describe('fullPath', () => {
    it('contains the path passed to constructor', () => {
      expect(new ChURIRoute('some/path').fullPath).toBe('some/path');
      expect(new ChURIRoute('/some/path').fullPath).toBe('/some/path');
      expect(new ChURIRoute('').fullPath).toBe('');
      expect(new ChURIRoute('/').fullPath).toBe('/');
    });
  });

  describe('fragment', () => {
    it('is empty for empty path', () => {
      expect(new ChURIRoute('').fragment).toBe('');
    });
    it('contains leading slash', () => {
      expect(new ChURIRoute('/some').fragment).toBe('/some');
      expect(new ChURIRoute('/').fragment).toBe('/');
      expect(new ChURIRoute('/some/path').fragment).toBe('/some');
    });
    it('contains trailing slash', () => {
      expect(new ChURIRoute('/some/').fragment).toBe('/some/');
      expect(new ChURIRoute('//').fragment).toBe('//');
      expect(new ChURIRoute('/some/path/').get(1)?.fragment).toBe('path/');
    });
    it('is URL-decoded', () => {
      expect(new ChURIRoute('/some%20path').fragment).toBe('/some path');
    });
  });

  describe('name', () => {
    it('is URL-decoded', () => {
      expect(new ChURIRoute('some%20path').name).toBe('some path');
    });
    it('omits slashes', () => {
      expect(new ChURIRoute('').name).toBe('');
      expect(new ChURIRoute('/').name).toBe('');
      expect(new ChURIRoute('//').name).toBe('');
      expect(new ChURIRoute('/path').name).toBe('path');
      expect(new ChURIRoute('/path').name).toBe('path');
      expect(new ChURIRoute('path/').name).toBe('path');
      expect(new ChURIRoute('/path/').name).toBe('path');
    });
    it('omits dollar prefix', () => {
      expect(new ChURIRoute('/$some').name).toBe('some');
      expect(new ChURIRoute('/$some,other').name).toBe('some');
      expect(new ChURIRoute('/$some(foo)').name).toBe('some');
    });
    it('omits quote', () => {
      expect(new ChURIRoute("/'some").name).toBe('some');
      expect(new ChURIRoute("/'some,other").name).toBe('some');
    });
    it('does not omit quote of entry key', () => {
      expect(new ChURIRoute("/'some(foo)").name).toBe("'some");
    });
    it('omits charge', () => {
      expect(new ChURIRoute('name(foo)').name).toBe('name');
      expect(new ChURIRoute('name(foo);p=bar').name).toBe('name');
    });
    it('omits matrix parameters', () => {
      expect(new ChURIRoute('name;p=bar').name).toBe('name');
    });
  });

  describe('path', () => {
    it('strips `.` fragments', () => {
      expect(new ChURIRoute('.').path).toBe('');
      expect(new ChURIRoute('./').path).toBe('/');
      expect(new ChURIRoute('/.').path).toBe('/');
      expect(new ChURIRoute('/./').path).toBe('/');

      expect(new ChURIRoute('./some/./path/./').path).toBe('some/path/');
      expect(new ChURIRoute('./some/./path/.').path).toBe('some/path/');
      expect(new ChURIRoute('/./some/./path/.').path).toBe('/some/path/');
      expect(new ChURIRoute('/./some/./path/./').path).toBe('/some/path/');

      expect(new ChURIRoute('some/././path/./').path).toBe('some/path/');
      expect(new ChURIRoute('some/././path/.').path).toBe('some/path/');
      expect(new ChURIRoute('/some/././path/.').path).toBe('/some/path/');
      expect(new ChURIRoute('/some/././path/./').path).toBe('/some/path/');
    });
    it('handles `..` fragments', () => {
      expect(new ChURIRoute('some/../path').path).toBe('path');
      expect(new ChURIRoute('some/../path/').path).toBe('path/');
      expect(new ChURIRoute('/some/../path').path).toBe('/path');
      expect(new ChURIRoute('/some/../path').path).toBe('/path');

      expect(new ChURIRoute('some/long/../path').path).toBe('some/path');
      expect(new ChURIRoute('some/long/../path/').path).toBe('some/path/');
      expect(new ChURIRoute('/some/long/../path').path).toBe('/some/path');
      expect(new ChURIRoute('/some/long/../path/').path).toBe('/some/path/');

      expect(new ChURIRoute('some/very/long/../../path').path).toBe('some/path');
      expect(new ChURIRoute('some/very/long/../../path/').path).toBe('some/path/');
      expect(new ChURIRoute('/some/very/long/../../path').path).toBe('/some/path');
      expect(new ChURIRoute('/some/very/long/../../path/').path).toBe('/some/path/');
    });
    it('handles leading `..` fragments', () => {
      expect(new ChURIRoute('..').path).toBe('');
      expect(new ChURIRoute('../').path).toBe('/');
      expect(new ChURIRoute('/..').path).toBe('/');
      expect(new ChURIRoute('/../').path).toBe('/');

      expect(new ChURIRoute('../some').path).toBe('some');
      expect(new ChURIRoute('../some/').path).toBe('some/');
      expect(new ChURIRoute('/../some').path).toBe('/some');
      expect(new ChURIRoute('/../some/').path).toBe('/some/');
    });
    it('handles trailing `..` fragments', () => {
      expect(new ChURIRoute('some/..').path).toBe('');
      expect(new ChURIRoute('some/../').path).toBe('/');
      expect(new ChURIRoute('/some/..').path).toBe('/');
      expect(new ChURIRoute('/some/../').path).toBe('/');

      expect(new ChURIRoute('some/long/..').path).toBe('some');
      expect(new ChURIRoute('some/long/../').path).toBe('some/');
      expect(new ChURIRoute('/some/long/..').path).toBe('/some');
      expect(new ChURIRoute('/some/long/../').path).toBe('/some/');
    });
    it('is shorted for sub-route', () => {
      expect(new ChURIRoute('some/long/path').get(1)?.path).toBe('long/path');
      expect(new ChURIRoute('some/long/path/').get(1)?.path).toBe('long/path/');
      expect(new ChURIRoute('/some/long/path').get(1)?.path).toBe('long/path');
      expect(new ChURIRoute('/some/long/path/').get(1)?.path).toBe('long/path/');
    });
    it('is not URL-decoded', () => {
      expect(new ChURIRoute('/some%20path').path).toBe('/some%20path');
    });
  });

  describe('charge', () => {
    it('is string value without charge', () => {
      expect(new ChURIRoute('/path').charge).toHaveURIChargeValue('path');
    });
    it('recognizes single charge', () => {
      expect(new ChURIRoute('/path(foo)').charge).toHaveURIChargeItems({ path: 'foo' });
    });
    it('recognizes list charge', () => {
      expect(new ChURIRoute('/path,foo,bar)').charge).toHaveURIChargeItems('path', 'foo', 'bar');
    });
    it('recognizes map charge', () => {
      expect(new ChURIRoute('/path(foo)bar(baz)').charge).toHaveURIChargeItems({
        path: 'foo',
        bar: 'baz',
      });
    });
  });

  describe('matrix', () => {
    it('is empty by default', () => {
      const { matrix } = new ChURIRoute('/path');

      expect([...matrix]).toHaveLength(0);
    });
    it('is empty without parameters', () => {
      const { matrix } = new ChURIRoute('/path;');

      expect([...matrix]).toHaveLength(0);
    });
    it('recognizes matrix parameters', () => {
      const { matrix } = new ChURIRoute('/path;p1=v1(foo);p2=v2');

      expect(matrix.getCharge('p1')).toHaveURIChargeEntries({ v1: 'foo' });
      expect(matrix.getCharge('p2')).toHaveURIChargeItems('v2');
    });
  });

  describe('get', () => {
    it('returns itself for index 0', () => {
      const route = new ChURIRoute('some/path');

      expect(route).toHaveLength(2);
      expect(route.get(0)).toBe(route);
      expect(route.fragment).toBe('some');
    });
    it('returns next fragment for index 1', () => {
      const route = new ChURIRoute('some/path');

      expect(route).toHaveLength(2);
      expect(route.index).toBe(0);

      const subRoute = route.get(1);

      expect(subRoute).toHaveLength(2);
      expect(subRoute?.fragment).toBe('path');
    });
    it('returns previous fragment', () => {
      const route = new ChURIRoute('some/path');

      expect(route.get(1)?.get(-1)).toBe(route);
    });
    it('returns nothing for invalid indices', () => {
      const route = new ChURIRoute('/some/path');

      expect(route.get(-1)).toBeUndefined();
      expect(route.get(2)).toBeUndefined();
      expect(route.get(0.1)).toBeUndefined();
      expect(route.get('length' as unknown as number)).toBeUndefined();
    });
  });

  describe('toString', () => {
    it('reflects path', () => {
      expect(String(new ChURIRoute('some/long/path'))).toBe('some/long/path');
      expect(String(new ChURIRoute('some/long/path').get(1))).toBe('long/path');
    });
  });

  describe('toJSON', () => {
    it('reflects path', () => {
      expect(JSON.stringify(new ChURIRoute('some/long/path'))).toBe('"some/long/path"');
      expect(JSON.stringify(new ChURIRoute('some/long/path').get(1))).toBe('"long/path"');
    });
  });
});
