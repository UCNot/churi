import { beforeAll, describe, expect, it } from '@jest/globals';
import './spec/uri-charge-matchers.js';
import { UcSearchParams } from './uc-search-params.js';

describe('UcSearchParams', () => {
  it('parsed from string', () => {
    const input = 'a=1&b=2&a=3';
    const params = new UcSearchParams(input);
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
    const params = new UcSearchParams(input);
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
    const input = 'a&b=2';
    const params = new UcSearchParams(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', ''],
      ['b', '2'],
    ]);
    expect(String(params)).toBe('a=&b=2');
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles value with `=`', () => {
    const input = 'a==&b=2=3';
    const params = new UcSearchParams(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '='],
      ['b', '2=3'],
    ]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    // expect(String(params)).toBe(String(urlParams));
  });
  it('handles empty key', () => {
    const input = '=1&=2';
    const params = new UcSearchParams(input);
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
    const params = new UcSearchParams(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([['key foo', 'value bar']]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('handles percent-encoded symbols', () => {
    const input = 'key%2Bfoo=value%2Bbar';
    const params = new UcSearchParams(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([['key+foo', 'value+bar']]);
    expect(String(params)).toBe(input);
    expect([...params]).toEqual([...urlParams]);
    expect(String(params)).toBe(String(urlParams));
  });
  it('ignores leading `?`', () => {
    const input = '?a=1&b=2&a=3';
    const params = new UcSearchParams(input);
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
    const params = new UcSearchParams('');

    expect([...params]).toEqual([]);
    expect(String(params)).toBe('');
  });
  it('is empty for `?` string', () => {
    const params = new UcSearchParams('?');

    expect([...params]).toEqual([]);
    expect(String(params)).toBe('');
  });
  it('constructed by iterable', () => {
    const urlParams = new URLSearchParams('a=a1&b=b2&a=c3');
    const params = new UcSearchParams(urlParams);

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
    const params = new UcSearchParams(input);
    const urlParams = new URLSearchParams(input);

    expect([...params]).toEqual([
      ['a', '1'],
      ['b', '2'],
    ]);
    expect([...params]).toEqual([...urlParams]);
  });

  describe('has', () => {
    let params: UcSearchParams;

    beforeAll(() => {
      params = new UcSearchParams('aaa=1&bbb');
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
    let params: UcSearchParams;

    beforeAll(() => {
      params = new UcSearchParams('aaa=111&bbb&aaa=333');
    });

    it('returns first parameter value', () => {
      expect(params.get('aaa')).toBe('111');
    });
    it('returns empty string for parameters without values', () => {
      expect(params.get('bbb')).toBe('');
    });
    it('returns `null` for absent parameters', () => {
      expect(params.get('ccc')).toBeNull();
    });
    it('recognizes parameter without value', () => {
      expect(new UcSearchParams('aaa').get('aaa')).toBe('');
    });
    it('recognizes value with `=` char', () => {
      expect(new UcSearchParams('aaa=bbb=ccc').get('aaa')).toBe('bbb=ccc');
    });
  });

  describe('getAll', () => {
    let params: UcSearchParams;

    beforeAll(() => {
      params = new UcSearchParams('aaa&bbb=222&aaa=333');
    });

    it('returns all parameter values', () => {
      expect(params.getAll('aaa')).toEqual(['', '333']);
      expect(params.getAll('bbb')).toEqual(['222']);
    });
    it('returns empty string for absent parameters', () => {
      expect(params.getAll('ccc')).toEqual([]);
    });
  });

  describe('iteration', () => {
    let params: UcSearchParams;
    let urlParams = new URLSearchParams();

    beforeAll(() => {
      urlParams = new URLSearchParams('aaa=111&bbb&aaa=333');
      params = new UcSearchParams(urlParams);
    });

    describe('keys', () => {
      it('iterates over keys in order of appearance', () => {
        expect([...params.keys()]).toEqual(['aaa', 'bbb', 'aaa']);
        expect([...params.keys()]).toEqual([...urlParams.keys()]);
      });
    });

    describe('values', () => {
      it('iterates over values in order of appearance', () => {
        expect([...params.values()]).toEqual(['111', '', '333']);
        expect([...params.values()]).toEqual([...urlParams.values()]);
      });
    });

    describe('entries', () => {
      it('iterates over entries in order of appearance', () => {
        expect([...params.entries()]).toEqual([
          ['aaa', '111'],
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
          ['111', 'aaa', params],
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

  describe('charge', () => {
    it('obtains parameter charges', () => {
      const params = new UcSearchParams('?foo=bar(test)&foo=1&baz=(21)(22)&test');

      expect(params.chargeOf('foo')).toHaveURIChargeItems({ bar: 'test' }, 1);
      expect(params.chargeOf('baz')).toHaveURIChargeItems(21, 22);
      expect(params.chargeOf('test')).toHaveURIChargeItems('');

      expect(params.charge).toHaveURIChargeItems({
        foo: [{ bar: 'test' }, 1],
        baz: [21, 22],
        test: '',
      });
    });
    it('is cached', () => {
      const params = new UcSearchParams('?foo=bar(test)&foo=1&baz=(21)(22)&test');

      expect(params.charge).toBe(params.charge);
      expect(params.chargeOf('foo')).toBe(params.chargeOf('foo'));
    });
    it('is none for missing parameter', () => {
      const params = new UcSearchParams('?foo=bar(test)&foo=1&baz=(21)(22)&test');

      expect(params.chargeOf('missing')).toBe(params.chargeParser.chargeRx.none);
    });
    it('contains strings when constructed from iterable', () => {
      const params = new UcSearchParams([
        ['foo', 'bar(test)'],
        ['foo', '1'],
        ['baz', '(21)(22)'],
        ['test'],
      ] satisfies [string, string?][]);

      expect(params.chargeOf('foo')).toHaveURIChargeItems('bar(test)', '1');
      expect(params.chargeOf('baz')).toHaveURIChargeItems('(21)(22)');
      expect(params.chargeOf('test')).toHaveURIChargeItems('');

      expect(params.charge).toHaveURIChargeItems({
        foo: ['bar(test)', '1'],
        baz: '(21)(22)',
        test: '',
      });
    });
  });

  describe('toString', () => {
    it('percent-encodes special symbols', () => {
      const urlParams = new URLSearchParams(
        "p=0val&p=1val&p=2val&p=3val&p=4val&p=5val&p=6val&p=7val&p=8val&p=9val&p=!val!&p='val'&p=-val-&p=(foo(&p=)foo)",
      );
      const params = new UcSearchParams(urlParams);
      const output = String(params);

      expect(String(new URLSearchParams(output))).toBe(String(urlParams));
      expect(String(new URLSearchParams([...urlParams.entries()]))).toBe(String(urlParams));
      expect(output).toBe(
        'p=0val&p=1val&p=2val&p=3val&p=4val&p=5val&p=6val'
          + "&p=7val&p=8val&p=9val&p=%21val!&p=%27val'&p=-val-&p=%28foo%28&p=%29foo%29",
      );
    });
  });
});
