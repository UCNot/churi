# Example Explained

```
https://example.com/!v(3)api/user;id=0n302875106592253/article;slug=hello-world/comments?date=since(!date'1970-01-01)till(!now)&range=from(10)to(20)
```

Here:

- `/!v(3)api` is an `/api` path fragment charged with `!v(3)` _metadata attribute_.

  _Metadata_ extends URI Charge Notation. Any number of metadata attributes may precede the value. Attribute has a name
  immediately following the exclamation mark (`!v`), and value enclosed in parentheses (`(3)`).

  Metadata can be used by charge processors.

- `/user;id=0n302875106592253` is a `/user` path fragment charged with user ID specified as `id` matrix parameter.

  Notice the `0n` prefix preceding [BigInt] value (unsupported by JSON).

- `/article;slug=hello-world` is an `/article` path fragment with simple string matrix parameter.

- `?date=since(!date'1970-01-01)till(!now)` is a `date` query parameter charged with map value.

  Notice the `!date'1970-01-01` _formatted data_ and `!now` _entity_.

  _Formatted data_ is another URI Charge Notation extension. It consists of format name following the exclamation mark
  (`!data`), and data specific to the named format following the apostrophe (`'1970-01-01`). Formatted data interpreted
  by custom handlers. It can be used to represent values non-standard to URI Charge Notation, e.g. date or base64.

  _Entity_ is the third URI Charge Notation extension that represents simple values or constants. Entities recognized
  by custom handlers. Standard entities include `!Infinity`, `!-Infinity`, and `!NaN`.

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

> **[Read more about URI Charge Notation >>>][URI Charge]**

[BigInt]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[URI Charge]: ./uri-charge.md
