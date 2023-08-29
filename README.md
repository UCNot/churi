# ChURI

ChURI is a polyglot serializer, deserializer and validator supporting various data formats.

The data processing is based on data schemas. Schemas are written in TypeScript. ChURI compiles such schemas into
efficient code implementing serializers, deserializers, and validators for the data conforming to those schemas.

The main data format supported is URI Charge Notation, which is used to encode data included into URI. Such URI
is called Charged URI, or ChURI.

Other data formats supported out of the box:

- JSON
- `application/x-www-form-urlencoded` (URI query parameters)
- URL-encoded
- plain text

Some formats support _insets_ containing data in another formats. For example, the `application/x-www-form-urlencoded`
format allows query parameter values to be encoded as URL-encoded ones, as plain text, or as URI Charge. The choice
is made by data schema.

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api documentation]

## Charged URI and URI Charge

Charged URI (ChURI) may include arbitrary structured data. The data is encoded with [URI Charge] Notation.

It is like JSON for GET requests, but may include even more:

```
https://example.com/!v(3)api/user;id=0n302875106592253/article;slug=hello-world/comments?date=since(!date'1970-01-01)till(!now)&range=from(10)to(20)
```

> **[See the explanation >>>][explanation]**

> **[Read more about URI Charge Notation >>>][URI Charge]**

[npm-image]: https://img.shields.io/npm/v/churi.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/churi
[build-status-img]: https://github.com/UCNot/churi/workflows/Build/badge.svg
[build-status-link]: https://github.com/UCNot/churi/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/059cf0c8e981426591b8c9df3b327e4b
[quality-link]: https://app.codacy.com/gh/UCNot/churi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade
[coverage-img]: https://app.codacy.com/project/badge/Coverage/059cf0c8e981426591b8c9df3b327e4b
[coverage-link]: https://app.codacy.com/gh/UCNot/churi/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/UCNot/churi
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[API documentation]: https://ucnot.github.io/churi/
[explanation]: https://github.com/UCNot/churi/blob/master/doc/explanation.md
[URI Charge]: https://github.com/UCNot/churi/blob/master/doc/uri-charge.md

## This Package

This package provides:

- [ChURI] class, which is a read-only [URL class] that grants access to charges.
- URI [charging] utilities.
- [Schema]-based parser, serializer, and validator.
- URI Charge Notation support
- JSON support.
- `application/x-www-form-urlencoded` format support.
- Other formats support, such as plain text and URI-encoded values.

[ChURI]: https://github.com/UCNot/churi/blob/master/doc/churi.md
[charging]: https://github.com/UCNot/churi/blob/master/doc/churi.md#charging
[URL class]: https://developer.mozilla.org/docs/Web/API/URL
[Schema]: https://github.com/UCNot/churi/blob/master/doc/schema.md
