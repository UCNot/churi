# URI Charge Format

URI charge format designed to encode arbitrary JavaScript object as part of URI.

URI charge represents everything what JSON does, and even more. E.g. it is able to represent [BigInt] values natively.

The format is extensible, so it may represent something that needs a special representation. So, the [Infinity],
negative [Infinity] and [NaN] values are representable within URI charge with standard extensions enabled.

URI charge may be used in various parts of URI. E.g. within [query]:

```
?find=includes(first_name(john))&order=first_name(asc(!))second_name(asc(!))birthday(asc(-))&range=from(10)to(20)
```

[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[Infinity]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity
[NaN]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN
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

- Since _parentheses_ (`"(" (U+0028)` and `")" (U+0029)`) and _comma_ (`"," (U+002C)`) have special meaning within
  URI charge, they should be [percent-encoded].
- When encoded value starts with _apostrophe_ (`"'" (U+0027)`), the apostrophe is stripped, and the actual string
  value starts from the second symbol.
- A _quoted string_ starting with _apostrophe_ may include balanced set of _parentheses_ (`"(" (U+0028)`
  and `")" (U+0029)`). I.e. each _closing parenthesis_ should match the _opening_ one preceding it.
  A _comma_ (`"," (U+002C)`) is considered a part of such string only if it is enclosed into parentheses.
  This may be used to place _unchanged_ URI charge as a string value.
- Since _decimal digits_, `"!" (U+0021)`, `"$" (U+0024)`, `"'" (U+0027)`, and `"-" (U+002D)` prefixes have special
  meaning, they should be escaped with _apostrophe_ (`"'" (U+0027)`).

_Empty string_ may be left as is or encoded as single _apostrophe_ (`"'" (U+0027)`).

```
?first=John&middle='&last=Doe&birthday='1970-01-01
```

[percent=encoded]: https://www.rfc-editor.org/rfc/rfc3986#section-2.1

## List

List corresponds to JavaScript [array literal].

List encoded as series of item values separated by _comma_ (`"," (U+002C)`).

```
foo,bar,baz
```

represents an array like

```json
["foo", "bar", "baz"]
```

Leading and trailing comma ignored within list. So the list above can be encoded as:

```
,foo,bar,baz
foo,bar,baz,
,foo,bar,baz,
```

_Empty list_ encoded as single _comma_ (`"," (U+002C)`). This is possible, because such comma is ignored.

List with _single item_ has to contain at leas one (leading or trailing _comma_ to distinguish it from single value:

```
,foo
foo,
,foo,
```

An item value is encoded in URI charge format. Thus it can be anything:

- boolean value: `!,-`
- number: `-128,127`
- empty string: `,'` or `,,`

### Nested List

An list item containing another (nested) list should be enclosed into parentheses:

```
(foo,bar),(baz)
```

represents an array like

```json
[['foo', 'bar], 'baz']
```

Note that comma is completely optional after nested list. So the list above can be encoded as:

```
(foo,bar)(baz)
```

Any level of nesting supported:

```
(1,(2.1,(2.1.1,2.1.2))((3.1.1,3.1.2)4.1)5)
```

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
  "includes": "john"
}
```

_Empty map_ has special representation: `$`

An entry value is encoded in URI charge format. Thus it can be anything:

- boolean value: `foo(!)bar(-)`
- number: `from(-128)to(127)`
- `null`: `is-null(--)`
- nested map: `foo(bar(baz))`
- nested empty map: `foo($)`
- list: `foo(bar,baz)`
- empty list: `foo(,)`
- multi-dimensional list: `foo((item1.1,item1.2)(item2.1,item2.2))
- empty string: `foo()`

Map entry may be specified multiple times. However, it is up to parser (or data schema) how to interpret this.
E.g. multiple values may be treated as list items. By default, the last entry value overrides preceding ones.

The following rules apply to entry keys:

- Since _parentheses_ (`"(" (U+0028)` and `")" (U+0029)`) and _comma_ (`"," (U+002C)`) have special meaning within
  URI charge, they should be [percent-encoded].
- When encoded value starts with _dollar sign_ (`"$" (U+0024)`), the dollar sign is stripped, and the actual key
  value starts from the second symbol. This can be used to escape symbols that have special meaning, except
  _parentheses_, that should be [percent-encoded].
- Since `"!" (U+0021)`, `"$" (U+0024)`, and `"'" (U+0027)` prefixes have special meaning, they should be escaped
  with _dollar sign_ (`"$" (U+0024)`).
- Empty key represented by single _dollar sign_ (`"$" (U+0024)`).

A special case when key prefixed with _dollar sign_ is not followed by value is treated as entry with empty string
value. I.e. `$key` is the same as `$key()`. Note that this rule does not work for single `$` symbol, which stands
for empty object. The `$()` has to be used for object with empty key and empty value (`{ '': '' }`).

A map may have _suffix_. I.e. the last entry key without value. Such suffix is treated as entry with empty string
value. So, `foo(bar)suffix` is the same as `foo(bar)suffix()` or `foo(bar)suffix(')`).

[object literal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#object_literals

## Entities

URI charge format can be extended with custom _entities_. An entity is opaque syntax construct that don't have
special meaning, unless recognized by custom parser.

Entity starts with _exclamation mark_ (`"!" (U+0021)`) followed by arbitrary string. It may include e.g. balanced
set of parentheses, just like a _quoted string_.

For example, the following entities supported by standard "Non-Finite Numbers" extension:

- `!Infinity` is treated as `Infinity` (positive infinity) numeric value.
- `!-Infinity` is treated as `-Infinity` (negative infinity) numeric value.
- `!NaN` is treated as `NaN` (not-a-number) value.

Entities either recognized by their names, or may have arbitrary syntax. E.g. they may have parameters:

```
!error(invalid-email,too-short,invalid-syntax)
```

It is up to parser implementation of how to treat the entity content. It may or may not strictly follow the URI charge
syntax.

Parameterized entity is called _directive_. Typically, it has one of three forms:

1. Directive with value:

   `!base64'SGVsbG8sIFdvcmxkIQ`

2. Directive with attributes:

   `!error(code(invalid-email)message(Invalid%20email),too-short,invalid-syntax)`

3. Directive with attributes and value:

   `!data(base64(!)content-type(text,plain)charset(utf-8))SGVsbG8sIFdvcmxkIQ`
