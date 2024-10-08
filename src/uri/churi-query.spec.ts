import { beforeAll, describe, expect, it } from '@jest/globals';
import '../spec/uri-charge-matchers.js';
import { ChURIQuery } from './churi-params.js';

describe('ChURIQuery', () => {
  it('parsed from string', () => {
    const input = 'a=1&b=2&a=3';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['a', '3'],
    ]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles missing params', () => {
    const input = 'a=1&&b=2&a=3&';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['a', '3'],
    ]);
    expect(String(params)).toBe('a=1&b=2&a=3');
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles missing value', () => {
    const input = '&a&b=2';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', ''],
      ['b', '2'],
    ]);
    expect(String(params)).toBe('a=&b=2');
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles positional argument', () => {
    const { arg } = new ChURIQuery('abc&a&b=2');

    expect(arg).toBeURIChargeSingle('string');
    expect(arg).toHaveURIChargeValue('abc');
  });
  it('handles missing positional argument', () => {
    const { arg } = new ChURIQuery('abc=&a&b=2');

    expect(arg).toBeURIChargeNone();
  });
  it('handles empty positional argument', () => {
    const { arg } = new ChURIQuery('&a&b=2');

    expect(arg).toBeURIChargeSingle('string');
    expect(arg).toHaveURIChargeValue('');
  });
  it('handles value with `=`', () => {
    const input = 'a==&b=2=3';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '='],
      ['b', '2=3'],
    ]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
  });
  it('handles empty key', () => {
    const input = '=1&=2';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['', '1'],
      ['', '2'],
    ]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('treats `+` as space', () => {
    const input = 'key+foo=value+bar';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([['key foo', 'value bar']]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles percent-encoded symbols', () => {
    const input = 'key%2Bfoo=value%2Bbar';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([['key+foo', 'value+bar']]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles plus-encoded space', () => {
    const input = 'key+foo=value++bar';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([['key foo', 'value  bar']]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('ignores leading `?`', () => {
    const input = '?a=1&b=2&a=3';
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['a', '3'],
    ]);
    expect(String(params)).toBe(input.slice(1));
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('is empty for empty string', () => {
    const params = new ChURIQuery('');

    expect([...params]).toEqual([]);
    expect(String(params)).toBe('');
  });
  it('is empty for `?` string', () => {
    const params = new ChURIQuery('?');

    expect([...params]).toEqual([]);
    expect(String(params)).toBe('');
  });
  it('constructed by iterable', () => {
    const urlParams = new URLSearchParams('a=a1&b=b2&a=c3');
    const params = new ChURIQuery(urlParams);

    expect([...params]).toEqual([
      ['a', 'a1'],
      ['b', 'b2'],
      ['a', 'c3'],
    ]);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('constructed by object literal', () => {
    const input = { a: 1, b: 2 } as Record<string, unknown> as Record<string, string>;
    const params = new ChURIQuery(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ]);
    expect([...params]).toEqual([...urlParams]);
  });

  describe('has', () => {
    let params: ChURIQuery;

    beforeAll(() => {
      params = new ChURIQuery('aaa=1&bbb');
    });

    it('detects parameter presence', () => {
      expect(params.has('aaa')).toBe(true);
      expect(params.has('bbb')).toBe(true);
    });
    it('detects parameter absence', () => {
      expect(params.has('ccc')).toBe(false);
    });
  });

  describe('get', () => {
    let params: ChURIQuery;

    beforeAll(() => {
      params = new ChURIQuery('aaa=11+1&bbb&aaa=333');
    });

    it('returns first parameter value', () => {
      expect(params.get('aaa')).toBe('11 1');
    });
    it('returns empty string for parameters without values', () => {
      expect(params.get('bbb')).toBe('');
    });
    it('returns `null` for absent parameters', () => {
      expect(params.get('ccc')).toBeNull();
    });
    it('recognizes second parameter without value', () => {
      params = new ChURIQuery('&aaa');

      expect(params.get('aaa')).toBe('');
    });
    it('recognizes value with `=` char', () => {
      params = new ChURIQuery('aaa=bbb=ccc');

      expect(params.get('aaa')).toBe('bbb=ccc');
    });
  });

  describe('getAll', () => {
    let params: ChURIQuery;

    beforeAll(() => {
      params = new ChURIQuery('&aaa&bbb=22+2&aaa=333');
    });

    it('returns all parameter values', () => {
      expect(params.getAll('aaa')).toEqual(['', '333']);
      expect(params.getAll('bbb')).toEqual(['22 2']);
    });
    it('returns empty string for absent parameters', () => {
      expect(params.getAll('ccc')).toEqual([]);
    });
  });

  describe('iteration', () => {
    let params: ChURIQuery;
    let urlParams = new URLSearchParams();

    beforeAll(() => {
      urlParams = new URLSearchParams('aa+a=11+1&bbb&aaa=333');
      params = new ChURIQuery(urlParams);
    });

    describe('keys', () => {
      it('iterates over keys in order of appearance', () => {
        expect([...params.keys()]).toEqual(['aa a', 'bbb', 'aaa']);
        expect([...params.keys()]).toEqual([...urlParams.keys()]);
      });
    });

    describe('values', () => {
      it('iterates over values in order of appearance', () => {
        expect([...params.values()]).toEqual(['11 1', '', '333']);
        expect([...params.values()]).toEqual([...urlParams.values()]);
      });
    });

    describe('entries', () => {
      it('iterates over entries in order of appearance', () => {
        expect([...params.entries()]).toEqual([
          ['aa a', '11 1'],
          ['bbb', ''],
          ['aaa', '333'],
        ]);
        expect([...params.entries()]).toEqual([...urlParams.entries()]);
      });
    });

    describe('forEach', () => {
      it('iterates over parameters', () => {
        const result: unknown[] = [];

        params.forEach((...args) => {
          result.push(args);
        });

        expect(result).toEqual([
          ['11 1', 'aa a', params],
          ['', 'bbb', params],
          ['333', 'aaa', params],
        ]);

        const urlResult: unknown[] = [];

        urlParams.forEach((value, key) => {
          urlResult.push([value, key, params]);
        });

        expect(result).toEqual(urlResult);
      });
    });
  });

  describe('getCharge', () => {
    it('contains parameter charges', () => {
      const params = new ChURIQuery('?foo=bar(test)&foo=1&baz=21,22&test');

      expect(params.getCharge('foo')).toHaveURIChargeItems({ bar: 'test' }, 1);
      expect(params.getCharge('baz')).toHaveURIChargeItems(21, 22);
      expect(params.getCharge('test')).toHaveURIChargeItems('');
    });
    it('is cached', () => {
      const params = new ChURIQuery('?foo=bar(test)&foo=1&baz=(21)(22)&test');

      expect(params.getCharge('foo')).toBe(params.getCharge('foo'));
    });
    it('is none for missing parameter', () => {
      const params = new ChURIQuery('?foo=bar(test)&foo=1&baz=(21)(22)&test');

      expect(params.getCharge('missing')).toBeURIChargeNone();
    });
    it('contains strings when constructed from iterable', () => {
      const params = new ChURIQuery([
        ['foo', 'bar(test)'],
        ['foo', '1'],
        ['baz', '(21)(22)'],
        ['test'],
      ] satisfies [string, string?][]);

      expect(params.getCharge('foo')).toHaveURIChargeItems('bar(test)', 1);
      expect(params.getCharge('baz')).toHaveURIChargeItems('(21)(22)');
      expect(params.getCharge('test')).toHaveURIChargeItems('');
    });
    it('decodes plus as spaces', () => {
      const params = new ChURIQuery('?foo=bar+(+te+++st+)+&foo=+1&baz=21+,+22&test');

      expect(params.getCharge('foo')).toHaveURIChargeItems({ bar: 'te   st' }, 1);
      expect(params.getCharge('baz')).toHaveURIChargeItems(21, 22);
      expect(params.getCharge('test')).toHaveURIChargeItems('');
    });
  });

  describe('toString', () => {
    it('percent-encodes special symbols', () => {
      const urlParams = new URLSearchParams(
        "p=0val&p=1val&p=2val&p=3val&p=4val&p=5val&p=6val&p=7val&p=8val&p=9val&p=!val!&p='val'&p=-val-&p=(foo(&p=)foo)",
      );
      const params = new ChURIQuery(urlParams);
      const output = String(params);

      expect(String(new URLSearchParams(output))).toBe(String(urlParams));
      expect(String(new URLSearchParams([...urlParams.entries()]))).toBe(String(urlParams));
      expect(output).toBe(
        'p=0val&p=1val&p=2val&p=3val&p=4val&p=5val&p=6val' +
          '&p=7val&p=8val&p=9val&p=%21val%21&p=%27val%27&p=-val-&p=%28foo%28&p=%29foo%29',
      );
    });
  });
});
