# URI Charge Schema Processing

Apart from including into URI, the [URI Charge] Notation can be used as a data interchange format.

The `application/uri-charge` MIME type is based on [URI Charge] Notation. It has fewer limitations though, as encoded
messages are not meant to be part of URIs:

- Any Unicode character allowed within `application/uri-charge`

  Some text symbols still have to be percent-encoded, as they have a special meaning within [URI charge]. E.g. `,`, `(`,
  or `)`.

- Spaces, tabs and newlines can be used to arrange the text:

  ```
  range (
    since (
      !date'1970-01-01
    ) till (
      !now
    )
  )
  ```

[URI Charge]: ./uri-charge.md

## Data Schema

Data schema describes particular JavaScript data type. The schema is used to generate _serializer_ and _deserializer_.
_Serializer_ is a function that converts data value to `application/uri-charge` message, while _deserializer_ parses
`application/uri-charge` message and reconstructs the original data value.
_Deserializer_ can also _validate_ the incoming data.

## Supported Data Types

[BigInt], [Boolean], [Number] and [String] constructors are schemas for corresponding primitive data types.

`ucList()` function creates a schema for JavaScript array represented as [list] within URI charge. Requires an
argument for element schema:

```typescript
import { ucList, type UcInfer, type UcSchema } from 'churi';

const listOfNumbersSchema = ucList(Number); // Define schema.
const listOfNumbers: UcInfer<typeof listOfNumbersSchema> = [1, 2, 3]; // Infer data type.
```

The `ucMap` function creates a schema for JavaScript object literal represented as [map] within URI charge. Requires
argument for property models:

```typescript
import { ucMap, type UcInfer, type UcSchema } from 'churi';

const rangeSchema = ucMap({
  from: Number,
  to: Number,
});
const range: UcInfer<typeof rangeSchema> = {
  from: 0,
  to: 10,
};
```

[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[Boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean
[Number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
[list]: ./uri-charge.md#list
[map]: ./uri-charge.md#map

## Schema Modifiers

By default, schema represents data type that does not accept `null` or `undefined` values. This can be changed with
`ucNullable()` and `ucOptional` modifiers.

```typescript
import { ucList, ucMap, ucNullable, ucOptional } from 'churi';

const listOfStringsOrNullsSchema = ucList(ucNullable(String));
const optionalBoundsRangeSchema = ucMap({
  from: ucOptional(Number),
  to: ucOptional(Number),
});
```
