# URI Charge Format

URI charge format designed to encode arbitrary JavaScript object as part of URI.

URI charge represents everything what JSON does, and even more. E.g. it is able to represent [BigInt] values natively.

The format is extensible, so it may represent something that needs a special representation. So, the [Infinity],
negative [Infinity] and [NaN] values are representable within URI charge with standard extensions enabled.

URI charge may be used in various parts of URI. E.g. within [query]:

```
?find=includes(john)(first_name)&order=first_name(asc(!))second_name(asc(!))birthday(asc(-))&range=from(10)to(20)
```

[bigint]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[infinity]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity
[nan]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN
[query]: https://www.rfc-editor.org/rfc/rfc3986#section-3.4

## Primitive Values

Any JavaScript [primitive], except [Symbol] and [undefined] (which stands value absence), has its representation within
URI charge.

[primitive]: https://developer.mozilla.org/en-US/docs/Glossary/Primitive
[symbol]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol
[undefined]: https://developer.mozilla.org/en-US/docs/Glossary/undefined

### Number

Numbers encoded as is:

- Any string started with _decimal digit_ (`"0" (U+OO30)` - `"9" (U+OO39)`) treated as positive number.
- Any string starting with _hyphen_ (`"-" (U+002D)`) followed by decimal digit treated as negative number.

The number string can be [percent-encoded].

Negative zero encoded as `-0`.

Hexadecimal and binary formats are also supported. For that, the string should start with `0x`/`-0x` and `0b`/`-0b` respectively.

Decimal digits also supported: `3.14159265359`, `0.1E-23`. Note that the leading `0` can not be omitted.

### BigInt

[BigInt] values encoded as decimal string preceded by `0n` or `-0n` prefix:

```
?from=-0n12344543&to=0n4354354452354
```

### Boolean

- `true` encoded as `!` - exactly one _exclamation mark_ (`"!" (U+0021)`).
- `false` encoded as `-` - exactly one _hyphen_ (`"-" (U+002D)`).

### Null

`null` encoded as `--` - exactly two _hyphens_ (`"-" (U+002D)`).

### String

String represented as [percent-encoded] value.

Additionally:

- Since _parentheses_ (`"(" (U+0028)` and `")" (U+0029)`) have special meaning within URI charge, they also should be
  [percent-encoded].
- When encoded value starts with _apostrophe_ (`"'" (U+0027)`), the apostrophe is stripped, and the actual string value
  starts from the second symbol. This can be used to escape symbols that have special meaning, except _parentheses_,
  that should be [percent-encoded].
- Since _decimal digits_, `"!" (U+0021)`, `"'" (U+0027)`, and `"-" (U+002D)` symbols have special meaning when used as
  the _first symbol_ of encoded value, they should be escaped with _apostrophe_ (`"'" (U+0027)`).

_Empty string_ may be left as is, or encoded as single _apostrophe_ (`"'" (U+0027)`).

```
?first=John&middle='&last=Doe&birthday='1970-01-01
```

[percent=encoded]: https://www.rfc-editor.org/rfc/rfc3986#section-2.1

## List

List corresponds to JavaScript [array literal].

List encoded as series of item values enclosed into _parentheses_.

```
(foo)(bar)(baz)
```

represents an array like

```json
["foo", "bar", "baz"]
```

_Empty array_ has special representation: `!!`

An item value is encoded in URI charge format. Thus it can be anything:

- boolean value: `(!)(-)`
- number: `(-128)(127)`
- nested array: `(('1.1)('1.2))(('2.1)('2.2))`
- nested empty array: `(!!)`
- `null`: `(--)`
- empty string: `()`

[array literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#array_literals

## Map

Map corresponds to JavaScript [object literal].

Map encoded as series of key/value entries. Each entry encoded as key followed by value enclosed into _parentheses_.

```
column(first_name)includes(john)
```

represents an object like

```json
{
  "column": "first_name",
  "includes": "john
}
```

_Empty map_ has special representation: `!()`

An entry value is encoded in URI charge format. Thus it an be anything:

- boolean value: `foo(!)bar(-)`
- number: `from(-128)to(127)`
- `null`: `is-null(--)`
- nested map: `foo(bar(baz))`
- nested empty map: `foo(!())`
- empty array: `foo(!!)`
- empty string: `foo()`

If entry value is an array (`foo((bar)(baz))`), it can be encoded without enclosing parentheses: `foo(bar)(baz)`.

Entry key should be encoded and/or escaped like any string value, except _decimal digits_ and _hyphen_ have no special
meaning for keys and can be left as is:

```
--host(google.com)4(!)
```

When entry key is empty, it has to be encoded as single _apostrophe_ (`"'" (U+0027)`):

```
'(foo)
```

corresponds to

```json
{
  "": "foo"
}
```

[object literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#object_literals

### Map Suffix

Map may have suffix. I.e. the last entry key without value. Such suffix is treated as entry with empty string value.
So, the `foo(bar)suffix` is the same as `foo(bar)suffix()` or `foo(bar)suffix(')`)

Map may follow the list. Such map is treated as the last item of the list.
So, the `(1)(2)foo(bar)suffix` is the same as `(1)(2)(foo(bar)suffix)`

## Extensions

URI charge format can be extended with custom _entities_ and _directives_. They don't have special meaning, unless
recognized by custom parser.

### Entity

Entity starts with _exclamation mark_ (`"!" (U+0021)`) followed by entity name. It is up to the parser how to treat it.

For example, the following entities supported by standard "Number Values" extension:

- `!Infinity` is treated as `Infinity` (positive infinity) numeric value.
- `!-Infinity` is treated as `-Infinity` (negative infinity) numeric value.
- `!NaN` is treated as `NaN` (not-a-number) value.

### Directive

Like entity, directive starts with _exclamation mark_ (`"!" (U+0021)`) followed by directive name. In contrast to
entity, directive accepts arguments:

```
!error(invalid-email)(too-short)(invalid-syntax)
```

Directive may have one argument or multiple arguments. In the latter case they have the same format as list, including
trailing object:

```
!data(SGVsbG8sIFdvcmxkIQ)base64(!)content-type(text%2Fplain)charset(utf-8)
```
