import { describe, expect, it } from '@jest/globals';
import { ChURIDirective, ChURIEntity } from './ch-uri-value.js';
import { parseURICharge } from './parse-uri-charge.js';
import { encodeURICharge } from './uri-charge-codec.js';
import { URIChargeEncodable } from './uri-charge-encodable.js';
import { URICharge } from './uri-charge.js';

describe('encodeURICharge', () => {
  describe('bigint value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge(13n)).toBe('0n13');
      expect(encodeURICharge(-13n)).toBe('-0n13');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: 13n, bar: -13n })).toBe('foo(0n13)bar(-0n13)');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([13n, -13n])).toBe('(0n13)(-0n13)');
    });
  });

  describe('boolean value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge(true)).toBe('!');
      expect(encodeURICharge(false)).toBe('-');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: true })).toBe('foo(!)');
      expect(encodeURICharge({ foo: false })).toBe('foo(-)');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([true])).toBe('(!)');
      expect(encodeURICharge([false])).toBe('(-)');
    });
  });

  describe('function value', () => {
    it('results to `undefined` by default', () => {
      expect(encodeURICharge(() => 1)).toBeUndefined();
    });
    it('uses custom encoder', () => {
      const fn: URIChargeEncodable = () => 1;

      fn.encodeURICharge = () => '!fn';
      fn.toJSON = () => '!fn.json';

      expect(encodeURICharge(fn)).toBe('!fn');
    });
    it('uses JSON encoder', () => {
      const fn: URIChargeEncodable = () => 1;

      fn.toJSON = () => ({ fn: true });

      expect(encodeURICharge(fn)).toBe('fn(!)');
    });
  });

  describe('number value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge(13)).toBe('13');
      expect(encodeURICharge(-13)).toBe('-13');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: 13, bar: -13 })).toBe('foo(13)bar(-13)');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([13, -13])).toBe('(13)(-13)');
    });
    it('encodes NaN', () => {
      expect(encodeURICharge(NaN)).toBe('!NaN');
    });
    it('encodes infinite values', () => {
      expect(encodeURICharge(Infinity)).toBe('!Infinity');
      expect(encodeURICharge(-Infinity)).toBe('!-Infinity');
    });
  });

  describe('string value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge('Hello, World!')).toBe('Hello%2C%20World!');
      expect(encodeURICharge('-test')).toBe("'-test");
      expect(encodeURICharge('-test', { as: 'top' })).toBe('%2Dtest');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: 'Hello, World!' })).toBe('foo(Hello%2C%20World!)');
      expect(encodeURICharge({ foo: '-test' })).toBe("foo('-test)");
      expect(encodeURICharge({ foo: '-test' }, { as: 'top' })).toBe("foo('-test)");
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge(['Hello, World!'])).toBe('(Hello%2C%20World!)');
      expect(encodeURICharge(['-test'])).toBe("('-test)");
      expect(encodeURICharge(['-test'], { as: 'top' })).toBe("('-test)");
    });
  });

  describe('null value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge(null)).toBe('--');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: null })).toBe('foo(--)');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([null])).toBe('(--)');
    });
  });

  describe('undefined value', () => {
    it('is not encoded at top level', () => {
      expect(encodeURICharge(undefined)).toBeUndefined();
    });
    it('is not encoded as map entry value', () => {
      expect(encodeURICharge({ foo: undefined })).toBe('!()');
      expect(encodeURICharge({ foo: undefined, bar: 1 })).toBe('bar(1)');
      expect(encodeURICharge({ bar: 1, foo: undefined })).toBe('bar(1)');
    });
    it('is encoded like null as array item value', () => {
      expect(encodeURICharge([undefined])).toBe('(--)');
      expect(encodeURICharge([1, undefined])).toBe('(1)(--)');
      expect(encodeURICharge([undefined, 2])).toBe('(--)(2)');
    });
  });

  describe('object value', () => {
    it('encoded as top-level map', () => {
      expect(encodeURICharge({ foo: 'bar' })).toBe('foo(bar)');
    });
    it('encoded when nested', () => {
      expect(encodeURICharge({ foo: { bar: 'baz' } })).toBe('foo(bar(baz))');
    });
    it('encoded when deeply nested', () => {
      expect(encodeURICharge({ foo: { bar: { baz: 1 } } })).toBe('foo(bar(baz(1)))');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([{ foo: 'bar' }])).toBe('(foo(bar))');
    });
    it('appended to list when last item value', () => {
      expect(encodeURICharge(['', { foo: 'bar' }])).toBe('()foo(bar)');
    });
    it('uses custom encoder', () => {
      const obj: URIChargeEncodable = {
        encodeURICharge: () => '!obj',
        toJSON: () => '!obj.json',
      };

      expect(encodeURICharge(obj)).toBe('!obj');
    });
    it('uses JSON encoder', () => {
      const obj: URIChargeEncodable = {
        toJSON: () => ({
          obj: 'json',
        }),
      };

      expect(encodeURICharge(obj)).toBe('obj(json)');
    });
    it('encoded when prototype is `null`', () => {
      const object = Object.create(null);

      object.test = 'foo';

      expect(encodeURICharge(object)).toBe('test(foo)');
    });
    it('encoded when class instance', () => {
      class TestObject {

        foo = 'bar';

}

      expect(encodeURICharge(new TestObject())).toBe('foo(bar)');
    });
  });

  describe('empty object value', () => {
    it('encoded as top-level map', () => {
      expect(encodeURICharge({})).toBe('!()');
    });
    it('encoded when nested', () => {
      expect(encodeURICharge({ foo: {} })).toBe('foo(!())');
    });
    it('encoded when deeply nested', () => {
      expect(encodeURICharge({ foo: { bar: {} } })).toBe('foo(bar(!()))');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([{}])).toBe('(!())');
    });
  });

  describe('object entry key', () => {
    it('escaped', () => {
      expect(encodeURICharge({ '!foo': 1, '!bar': 2 })).toBe("'!foo(1)'!bar(2)");
    });
    it('percent-encoded at top level', () => {
      expect(encodeURICharge({ '!foo': 1, '!bar': 2 }, { as: 'top' })).toBe("%21foo(1)'!bar(2)");
    });
  });

  describe('suffix', () => {
    it('appended to map', () => {
      expect(encodeURICharge({ test1: '', test2: '', suffix: '' })).toBe('test1()test2()suffix');
    });
    it('appended to list when last item value', () => {
      expect(encodeURICharge(['', { foo: '' }])).toBe('()foo');
    });
  });

  describe('array value with one item', () => {
    it('encoded as top-level list', () => {
      expect(encodeURICharge(['bar'])).toBe('(bar)');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: ['bar'] })).toBe('foo((bar))');
    });
    it('encoded as nested list item value', () => {
      expect(encodeURICharge([['bar']])).toBe('((bar))');
    });
    it('encoded as deeply nested list item value', () => {
      expect(encodeURICharge([[['bar']]])).toBe('(((bar)))');
    });
  });

  describe('array value with multiple items', () => {
    it('encoded as top-level list', () => {
      expect(encodeURICharge(['bar', 'baz'])).toBe('(bar)(baz)');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: ['bar', 'baz'] })).toBe('foo(bar)(baz)');
    });
    it('encoded as nested list item value', () => {
      expect(encodeURICharge([['bar', 'baz']])).toBe('((bar)(baz))');
    });
    it('encoded as deeply nested list item value', () => {
      expect(encodeURICharge([[['bar', 'baz']]])).toBe('(((bar)(baz)))');
    });
  });

  describe('empty array value', () => {
    it('encoded as top-level list', () => {
      expect(encodeURICharge([])).toBe('!!');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: [] })).toBe('foo(!!)');
    });
    it('encoded as nested list item value', () => {
      expect(encodeURICharge([[]])).toBe('(!!)');
    });
    it('encoded as deeply nested list item value', () => {
      expect(encodeURICharge([[[]]])).toBe('((!!))');
    });
  });

  describe('unknown entity value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge(new ChURIEntity('!test'))).toBe('!test');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: new ChURIEntity('!test') })).toBe('foo(!test)');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([new ChURIEntity('!test')])).toBe('(!test)');
    });
  });

  describe('unknown directive value', () => {
    it('encoded as top-level value', () => {
      expect(encodeURICharge(new ChURIDirective('!test', 'foo'))).toBe('!test(foo)');
    });
    it('encoded as map entry value', () => {
      expect(encodeURICharge({ foo: new ChURIDirective('!test', 'bar') })).toBe('foo(!test(bar))');
    });
    it('encoded as list item value', () => {
      expect(encodeURICharge([new ChURIDirective('!test', 'foo')])).toBe('(!test(foo))');
    });
    it('encoded with array value', () => {
      expect(encodeURICharge(new ChURIDirective('!test', ['foo', 'bar']))).toBe('!test(foo)(bar)');
    });
    it('encoded with suffix', () => {
      expect(encodeURICharge(new ChURIDirective('!test', ['foo', { suffix: '' }]))).toBe(
        '!test(foo)suffix',
      );
    });
    it('encoded with missing value', () => {
      expect(encodeURICharge(new ChURIDirective('!test', undefined!))).toBe('!test(--)');
    });
  });

  describe('URICharge', () => {
    it('encoded when simple', () => {
      expect(String(parseURICharge('%74est').charge)).toBe('test');
    });
    it('encoded when map', () => {
      expect(String(parseURICharge('%74est(foo)').charge)).toBe('test(foo)');
    });
    it('encoded when list', () => {
      expect(String(parseURICharge('(foo)(%74est').charge)).toBe('(foo)(test)');
    });
    it('encoded when directive', () => {
      expect(String(parseURICharge('!foo(%74est').charge)).toBe('!foo(test)');
    });
    it('is not encoded when none', () => {
      expect(String(URICharge.none)).toBe('!None');
      expect(encodeURICharge(URICharge.none)).toBeUndefined();
    });
  });
});
