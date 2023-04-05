import { describe, expect, it } from '@jest/globals';
import '../spec/uri-charge-matchers.js';
import { ChURI } from './churi.js';

describe('ChURI', () => {
  describe('scheme', () => {
    it('can not be empty', () => {
      expect(() => new ChURI('/some/path')).toThrow(new TypeError('Invalid URI'));
    });
    it('contains protocol without trailing colon', () => {
      const uri = new ChURI('FILE:///path');

      expect(uri.scheme).toBe('file');
      expect(uri.protocol).toBe('file:');
    });
    it('contains hierarchical protocol', () => {
      const uri = new ChURI('BLOB:FILE:///path');

      expect(uri.scheme).toBe('blob:file');
      expect(uri.protocol).toBe('blob:file:');
    });
  });

  describe('host info', () => {
    it('is empty when missing', () => {
      const url = new URL('route:');
      const uri = new ChURI(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is empty with relative path', () => {
      const url = new URL('route:path');
      const uri = new ChURI(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is empty with absolute path', () => {
      const url = new URL('route:/path');
      const uri = new ChURI(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is defined when present', () => {
      const uri = new ChURI('route://user@host/path');

      expect(uri.host).toBe('host');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(uri.toURL().origin);
    });
    it('is defined when present in http URL', () => {
      const uri = new ChURI('http://host/path');

      expect(uri.host).toBe('host');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe('http://host');
    });
    it('is defined when empty', () => {
      const uri = new ChURI('file:///path/to/file');

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(uri.toURL().origin);
    });
    it('is defined with empty port', () => {
      const uri = new ChURI('http://host:/path');

      expect(uri.host).toBe('host');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe('http://host');
    });
    it('contains port number', () => {
      const uri = new ChURI('http://host:8080/path');

      expect(uri.host).toBe('host:8080');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('8080');
      expect(uri.origin).toBe('http://host:8080');
    });
  });

  describe('user info', () => {
    it('is empty when host is missing', () => {
      const uri = new ChURI('route:');

      expect(uri.username).toBe('');
      expect(uri.password).toBe('');
    });
    it('is empty when path looks like user info', () => {
      const uri = new ChURI('route:user@host');

      expect(uri.username).toBe('');
      expect(uri.password).toBe('');
    });
  });

  describe('pathname', () => {
    it('is empty when host is missing', () => {
      const uri = new ChURI('route:');

      expect(uri.pathname).toBe('');
    });
    it('is empty when host is empty', () => {
      const uri = new ChURI('route://');

      expect(uri.pathname).toBe('');
    });
    it('is `/` when http path is missing', () => {
      const uri = new ChURI('http://host');

      expect(uri.pathname).toBe('/');
    });
    it('remains as is when host is missing and path is relative', () => {
      const uri = new ChURI('route:path');

      expect(uri.pathname).toBe('path');
    });
    it('remains as is when host is missing and path is absolute', () => {
      const uri = new ChURI('route:/path');

      expect(uri.pathname).toBe('/path');
    });
    it('remains as is when host is missing and path looks like user info', () => {
      const uri = new ChURI('route:user@host');

      expect(uri.pathname).toBe('user@host');
    });
  });

  describe('route', () => {
    it('contains normalized route', () => {
      expect(new ChURI('route:/path').route.path).toBe('/path');
      expect(new ChURI('route:path').route.path).toBe('path');
      expect(new ChURI('route:./path').route.path).toBe('path');
      expect(new ChURI('route:./path/to/file/..').route.path).toBe('path/to');
      expect(new ChURI('route:./path/to/file/../').route.path).toBe('path/to/');
      expect(new ChURI('route:./path/to/file/../dir/').route.path).toBe('path/to/dir/');
    });
    it('does not URI-decode path', () => {
      expect(new ChURI('route:/some%20path').route.path).toBe('/some%20path');
    });
  });

  describe('search', () => {
    it('is empty when absent', () => {
      const { search } = new ChURI('route:path');

      expect(search).toBe('');
    });
    it('is empty when empty', () => {
      const { search } = new ChURI('route:?');

      expect(search).toBe('');
    });
    it('remains as is when present', () => {
      const { search } = new ChURI('route:?test');

      expect(search).toBe('?test');
    });
  });

  describe('searchParams', () => {
    it('is empty when absent', () => {
      const { searchParams } = new ChURI('route:path');

      expect([...searchParams]).toEqual([]);
      expect(String(searchParams)).toBe('');
    });
    it('is empty when empty', () => {
      const { searchParams } = new ChURI('route:?');

      expect([...searchParams]).toEqual([]);
      expect(String(searchParams)).toBe('');
    });
    it('contains search parameters when present', () => {
      const { searchParams } = new ChURI('route:?&test&foo=bar');

      expect([...searchParams]).toEqual([
        ['test', ''],
        ['foo', 'bar'],
      ]);
      expect(String(searchParams)).toBe('test=&foo=bar');
    });
    it('contains positional argument when present', () => {
      const { query } = new ChURI('route:?test(foo)&bar=baz');

      expect(query.arg).toHaveURIChargeItems({ test: 'foo' });
      expect([...query]).toEqual([['bar', 'baz']]);
    });
  });

  describe('path override', () => {
    it('affects path and query', () => {
      const { route, query } = new ChURI('route:/some/path?/*;id=13?name=value');

      expect(route.path).toBe('/some;id=13/path');
      expect(query.get('name')).toBe('value');
    });
    it('does not affect query without search params', () => {
      const { query } = new ChURI('route:/some/path?/*;id=13#some');

      expect(query.toString()).toBe('');
    });
  });

  describe('query', () => {
    it('is an alias of searchParams', () => {
      const uri = new ChURI('route:?test&foo=bar');

      expect(uri.query).toBe(uri.searchParams);
    });
  });

  describe('hash', () => {
    it('is empty when absent', () => {
      const { hash } = new ChURI('route:path');

      expect(hash).toBe('');
    });
    it('is empty when empty', () => {
      const { hash } = new ChURI('route:#');

      expect(hash).toBe('');
    });
    it('remains as is when present', () => {
      const { hash } = new ChURI('route:#test');

      expect(hash).toBe('#test');
    });
  });

  describe('anchor', () => {
    it('is empty when absent', () => {
      const { anchor } = new ChURI('route:path');

      expect([...anchor]).toEqual([]);
      expect(String(anchor)).toBe('');
    });
    it('is empty when empty', () => {
      const { anchor } = new ChURI('route:#');

      expect([...anchor]).toEqual([]);
      expect(String(anchor)).toBe('');
    });
    it('contains parameters when present', () => {
      const { anchor } = new ChURI('route:#&test&foo=bar');

      expect([...anchor]).toEqual([
        ['test', ''],
        ['foo', 'bar'],
      ]);
      expect(String(anchor)).toBe('test=&foo=bar');
    });
    it('contains positional argument when present', () => {
      const { anchor } = new ChURI('route:#test(foo)&bar=baz');

      expect(anchor.arg).toHaveURIChargeItems({ test: 'foo' });
      expect([...anchor]).toEqual([['bar', 'baz']]);
    });
  });

  describe('auth', () => {
    it('is empty when absent', () => {
      const { auth } = new ChURI('route:path');

      expect([...auth]).toEqual([]);
      expect(String(auth)).toBe('');
    });
    it('is empty when empty', () => {
      const { auth } = new ChURI('https://user@example.com');

      expect([...auth]).toEqual([]);
      expect(String(auth)).toBe('');
    });
    it('contains parameters when present', () => {
      const { auth } = new ChURI('https://;test;foo=bar@example.com');

      expect([...auth]).toEqual([
        ['test', ''],
        ['foo', 'bar'],
      ]);
      expect(String(auth)).toBe('test=;foo=bar');
    });
    it('contains positional argument when present', () => {
      const uri = new ChURI('https://test(foo);bar=baz@example.com');

      const { auth } = uri;

      expect(auth.arg).toHaveURIChargeItems({ test: 'foo' });
      expect([...auth]).toEqual([['bar', 'baz']]);
    });
  });

  describe('href', () => {
    it('is the one of URL when authority present', () => {
      const href = 'http://user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(href);
      expect(String(uri)).toBe(href);
      expect(JSON.stringify(uri)).toBe(`"${href}"`);
      expect(uri.toURL().href).toBe(href);
    });
    it('is the one of URL when authority absent', () => {
      const href = 'route:user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(href);
      expect(String(uri)).toBe(href);
      expect(JSON.stringify(uri)).toBe(`"${href}"`);
      expect(uri.toURL().href).toBe(href);
    });
    it('is the one of URL when empty authority added automatically', () => {
      const href = 'file:user:password@host:2345/path?query#hash';
      const fileHref = 'file:///user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(href);
      expect(uri.toURL().href).toBe(fileHref);
    });
  });

  describe('data:', () => {
    it('represented as data URL', () => {
      const href = 'data:,Hello%2C%20World%21';
      const uri = new ChURI(href);

      expect(uri.href).toBe(href);
      expect(uri.toURL().href).toBe(href);
    });
  });
});
