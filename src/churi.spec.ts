import { describe, expect, it } from '@jest/globals';
import { Churi } from './churi.js';

describe('Churi', () => {
  describe('schema', () => {
    it('can not be empty', () => {
      expect(() => new Churi('/some/path')).toThrow(new TypeError('Invalid URL'));
    });
    it('contains protocol without trailing colon', () => {
      const uri = new Churi('file:///path');

      expect(uri.schema).toBe('file');
      expect(uri.protocol).toBe('file:');
    });
  });

  describe('host info', () => {
    it('is empty when missing', () => {
      const url = new URL('route:');
      const uri = new Churi(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is empty with relative path', () => {
      const url = new URL('route:path');
      const uri = new Churi(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is empty with absolute path', () => {
      const url = new URL('route:/path');
      const uri = new Churi(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is defined when present', () => {
      const uri = new Churi('http://host/path');

      expect(uri.host).toBe('host');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe('http://host');
    });
    it('is defined when empty', () => {
      const url = new URL('file:///path/to/file');
      const uri = new Churi(url.href);

      expect(uri.host).toBe('');
      expect(uri.hostname).toBe('');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe(url.origin);
    });
    it('is defined with empty port', () => {
      const uri = new Churi('http://host:/path');

      expect(uri.host).toBe('host');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('');
      expect(uri.origin).toBe('http://host');
    });
    it('contains port number', () => {
      const uri = new Churi('http://host:8080/path');

      expect(uri.host).toBe('host:8080');
      expect(uri.hostname).toBe('host');
      expect(uri.port).toBe('8080');
      expect(uri.origin).toBe('http://host:8080');
    });
  });

  describe('user info', () => {
    it('is empty when host is missing', () => {
      const uri = new Churi('route:');

      expect(uri.username).toBe('');
      expect(uri.password).toBe('');
    });
    it('is empty when path looks like user info', () => {
      const uri = new Churi('route:user@host');

      expect(uri.username).toBe('');
      expect(uri.password).toBe('');
    });
  });

  describe('pathname', () => {
    it('is empty when host is missing', () => {
      const uri = new Churi('route:');

      expect(uri.pathname).toBe('');
    });
    it('is empty when host is empty', () => {
      const uri = new Churi('route://');

      expect(uri.pathname).toBe('');
    });
    it('is `/` when http path is missing', () => {
      const uri = new Churi('http://host');

      expect(uri.pathname).toBe('/');
    });
    it('remains as is when host is missing and path is relative', () => {
      const uri = new Churi('route:path');

      expect(uri.pathname).toBe('path');
    });
    it('remains as is when host is missing and path is absolute', () => {
      const uri = new Churi('route:/path');

      expect(uri.pathname).toBe('/path');
    });
    it('remains as is when host is missing and path looks like user info', () => {
      const uri = new Churi('route:user@host');

      expect(uri.pathname).toBe('user@host');
    });
  });

  describe('search', () => {
    it('is empty when absent', () => {
      const uri = new Churi('route:path');

      expect(uri.search).toBe('');
    });
    it('is empty when empty', () => {
      const uri = new Churi('route:?');

      expect(uri.search).toBe('');
    });
    it('remains as is when present', () => {
      const uri = new Churi('route:?test');

      expect(uri.search).toBe('?test');
    });
  });

  describe('hash', () => {
    it('is empty when absent', () => {
      const uri = new Churi('route:path');

      expect(uri.hash).toBe('');
    });
    it('is empty when empty', () => {
      const uri = new Churi('route:#');

      expect(uri.hash).toBe('');
    });
    it('remains as is when present', () => {
      const uri = new Churi('route:#test');

      expect(uri.hash).toBe('#test');
    });
  });

  describe('href', () => {
    it('is the one of URL when authority present', () => {
      const href = 'http://user:password@host:2345/path?query#hash';
      const uri = new Churi(href);

      expect(uri.href).toBe(href);
      expect(String(uri)).toBe(href);
      expect(uri.toURL().href).toBe(href);
    });
    it('differs from URL when authority absent', () => {
      const href = 'route:user:password@host:2345/path?query#hash';
      const uri = new Churi(href);

      expect(uri.href).toBe(href);
      expect(String(uri)).toBe(href);
      expect(uri.toURL().href).toBe('route:///user:password@host:2345/path?query#hash');
    });
  });
});
