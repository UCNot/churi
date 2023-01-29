# Charged URI

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api documentation]

An URI that may contain arbitrary JavaScript values encoded with [URI charge] micro-format.

It is like JSON for GET requests, but can do even more.

URI charge may be used as:

- query parameter value,
- as [Matrix URI] parameters,
- as path fragment argument.

**Example:**

```
https://example.com/api(!v:3.0)/user;id=0n302875106592253/article;slug=hello-world/comments?date=since(!date:1970-01-01)till(!now)&range=from(10)to(20)
```

, where:

- `/api(!v:3.0)` is a path fragment charged with `!v:3.0` entity.

  Entities are URI charge format extensions treated by custom handlers.

- `/user;id=0n302875106592253` is a path fragment charged with user ID specified as `user` matrix parameter.

  Notice the `0n` prefix preceding [BigInt] value (unsupported by JSON).

- `/article;slug=hello-world` is a path fragment with simple string matrix parameter.

- `?date=since(!date:1970-01-01)till(!now)` is a query parameter charged with map value.

  Notice the `!date:1970-01-01` and `!now` entities.

  The `date` parameter charge corresponds to JavaScript object literal like:

  ```javascript
  {
    since: new Date('1970-01-01'),
    till: new Date(),
  }
  ```

- `&range=from(10)to(20)` is a query parameter charged with map value corresponding to JavaScript object literal like:
  ```javascript
  {
    from: 10, // A number rather a string!
    to: 20,   // A number rather a string!
  }
  ```

> **[Read more about URI charge format >>>][uri charge]**

[npm-image]: https://img.shields.io/npm/v/@hatsy/churi.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@hatsy/churi
[build-status-img]: https://github.com/hatsyjs/churi/workflows/Build/badge.svg
[build-status-link]: https://github.com/hatsyjs/churi/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/e0cde60880cf434f8e46f63334d86b1e
[quality-link]: https://www.codacy.com/gh/hatsyjs/churi/dashboard?utm_source=github.com&utm_medium=referral&utm_content=hatsyjs/churi&utm_campaign=Badge_Grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/e0cde60880cf434f8e46f63334d86b1e
[coverage-link]: https://www.codacy.com/gh/hatsyjs/churi/dashboard?utm_source=github.com&utm_medium=referral&utm_content=hatsyjs/churi&utm_campaign=Badge_Coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/hatsyjs/churi
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[API documentation]: https://hatsyjs.github.io/churi/
[URI charge]: https://github.com/hatsyjs/churi/blob/master/doc/uri-charge-format.md
[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[Matrix URI]: https://www.w3.org/DesignIssues/MatrixURIs.html

## Usage

This library represents Charged URIs as `ChURI` class instances. The latter resembles standard [URL class], except it is
read-only. It also provides access to:

- query parameter charges,
- path fragments and their charges,
- matrix parameters and their charges.

Everything is built on demand. Nothing is parsed until requested.

Given the example above:

```typescript
import { ChURI } from '@hatsy/churi';

const { route, searchParams: query } = new ChURI(
  'https://example.com' +
    '/api(!v:3.0)' +
    '/user;id=0n302875106592253' +
    '/article;slug=hello-world' +
    '/comments' +
    '?date=since(!date:1970-01-01)till(!now)' +
    '&range=from(10)to(20)',
);

console.debug(route.path);
// /api(!v(3.0))/user;id=0n302875106592253/article;slug=hello-world/comments

console.debug(route.name, route.charge.get('api').value);
// api 3.0

console.debug(route.at(1).name, route.at(1).matrix.chargeOf('id').value);
// user 302875106592253n

console.debug(route.at(2).name, route.at(2).matrix.chargeOf('slug').value);
// article hello-world

console.debug(query.chargeOf('date').get('since').value);
// 1970-01-01T00:00:00.000Z

console.debug(query.chargeOf('range').get('from').value, query.chargeOf('range').get('to').value);
// 10 20
```

[URL class]: https://developer.mozilla.org/en-US/docs/Web/API/URL

## Charging

The `ChURI` class is read-only. It disallows URI manipulations.

To build Charged URI a tagged template can be used.

The following code reconstructs the URI from example above:

```typescript
import { churi } from '@hatsy/churi';

console.debug(churi`
  https://example.com
    /api(${new UcEntity('!v:3.0')})
    /user;id=${302875106592253n}
    /article;slug=${'hello-world'}
    /comments
      ?date=${{
        since: new UcEntity('!date:1970-01-01'),
        till: new UcEntity('!now'),
      }}
      &range=${{
        from: 10,
        to: 20,
      }}
`);
```

The `UcEntity` above used to avoid escaping and percent-encoding and should be used with care.

Instead, a Charged URI string can be built with `chargeURI()` function.

```typescript
import { chargeURI, chargeURIArgs, UcDirective, UcEntity } from '@hatsy/churi';

console.debug(
  'https://example.com' +
    `/api(${chargeURI(new UcEntity('!v:3.0'))})` +
    `/user;id=${chargeURI(302875106592253n)}` +
    `/article;slug=${chargeURI('hello-world')}` +
    '/comments' +
    `?date=${chargeURI({
      since: new UcEntity('!date:1970-01-01'),
      till: new UcEntity('!now'),
    })}` +
    `&range=${chargeURI({
      from: 10,
      to: 20,
    })}`,
);
```

Charging can be customized by implementing a `chargeURI()` method of `URIChargeable` interface. If not implemented,
a `toJSON()` method will be used. Otherwise, predefined serialization algorithm will be applied similar to JSON
serialization.

## URI Charge Processing

URI charge can be parsed from string and represented:

- as `URICharge` instance by `parseURICharge()` function, or
- as native `JavaScript` value (`UcValue`) by `parseUcValue()` one.

There are more tools dealing with URI charge parsing and processing:

- `URIChargeParser` - generic URI charge parser,
- `URIChargeExt` - an extension mechanism for custom directives and entities,
- `URIChargeRx` - URI charge receiver API implementing a Visitor pattern for charge processing,
- `URIChargeBuilder` - `URIChargeRx` implementation used to build `URICharge` instances,
- `UcValueBuilder` - `URIChargeRx` implementation used to build `UcValue` instances.

> See [API documentation] for more info.
