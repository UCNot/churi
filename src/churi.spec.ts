import { describe, expect, it } from '@jest/globals';
import { ChURI } from './churi.js';

describe('ChURI', () => {
  describe('schema', () => {
    it('can not be empty', () => {
      expect(() => new ChURI('/some/path')).toThrow(new TypeError('Invalid URL'));
    });
    it('contains protocol without trailing colon', () => {
      const uri = new ChURI('file:///path');

      expect(uri.schema).toBe('file');
      expect(uri.protocol).toBe('file:');
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

  describe('search', () => {
    it('is empty when absent', () => {
      const uri = new ChURI('route:path');

      expect(uri.search).toBe('');
    });
    it('is empty when empty', () => {
      const uri = new ChURI('route:?');

      expect(uri.search).toBe('');
    });
    it('remains as is when present', () => {
      const uri = new ChURI('route:?test');

      expect(uri.search).toBe('?test');
    });
  });

  describe('hash', () => {
    it('is empty when absent', () => {
      const uri = new ChURI('route:path');

      expect(uri.hash).toBe('');
    });
    it('is empty when empty', () => {
      const uri = new ChURI('route:#');

      expect(uri.hash).toBe('');
    });
    it('remains as is when present', () => {
      const uri = new ChURI('route:#test');

      expect(uri.hash).toBe('#test');
    });
  });

  describe('href', () => {
    it('is the one of URL when authority present', () => {
      const href = 'http://user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(href);
      expect(String(uri)).toBe(href);
      expect(uri.toURL().href).toBe(href);
    });
    it('is the one of URL when authority absent', () => {
      const href = 'route:user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(href);
      expect(String(uri)).toBe(href);
      expect(uri.toURL().href).toBe(href);
    });
    it('is the one of URL when non-empty authority added automatically', () => {
      const href = 'http:user:password@host:2345/path?query#hash';
      const httpHref = 'http://user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(httpHref);
      expect(uri.toURL().href).toBe(httpHref);
    });
    it('is the one of URL when empty authority added automatically', () => {
      const href = 'file:user:password@host:2345/path?query#hash';
      const fileHref = 'file:///user:password@host:2345/path?query#hash';
      const uri = new ChURI(href);

      expect(uri.href).toBe(fileHref);
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
