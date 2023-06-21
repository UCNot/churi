# Charged URI and URI Charge Notation

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![Coverage][coverage-img]][coverage-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api documentation]

Charge URI (ChURI) may contain arbitrary values in [URI Charge] Notation.

It is like JSON for GET requests, but may contain even more:

```
https://example.com/api(!v3.0)/user;id=0n302875106592253/article;slug=hello-world/comments?date=since(!date'1970-01-01)till(!now)&range=from(10)to(20)
```

> **[See the explanation >>>][explanation]**

> **[Read more about URI Charge Notation >>>][URI Charge]**

[npm-image]: https://img.shields.io/npm/v/churi.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/churi
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
[explanation]: https://github.com/hatsyjs/churi/blob/master/doc/explanation.md
[URI Charge]: https://github.com/hatsyjs/churi/blob/master/doc/uri-charge.md

## This Package

This package provides:

- [ChURI] class, which is a read-only [URL class] that grants access to charges.
- URI [charging] utilities.
- [`application/uri-charge`] MIME type support:
  - Schema-based parser, serializer and validator.
  - Schema-less parser and serializer.

[ChURI]: https://github.com/hatsyjs/churi/blob/master/doc/churi.md
[charging]: https://github.com/hatsyjs/churi/blob/master/doc/churi.md#charging
[URL class]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[`application/uri-charge`]: https://github.com/hatsyjs/churi/blob/master/doc/schema.md
