# Example Explained

```
https://example.com/api(!v3.0)/user;id=0n302875106592253/article;slug=hello-world/comments?date=since(!date'1970-01-01)till(!now)&range=from(10)to(20)
```

See the [explanation].

, where:

- `/api(!v3.0)` is a path fragment charged with `!v3.0` entity.

  Entities are URI charge format extensions treated by custom handlers.

- `/user;id=0n302875106592253` is a path fragment charged with user ID specified as `user` matrix parameter.

  Notice the `0n` prefix preceding [BigInt] value (unsupported by JSON).

- `/article;slug=hello-world` is a path fragment with simple string matrix parameter.

- `?date=since(!date'1970-01-01)till(!now)` is a query parameter charged with map value.

  Notice the `!date'1970-01-01` and `!now` entities.

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

[BigInt]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
[URI charge]: https://github.com/hatsyjs/churi/blob/master/doc/uri-charge-format.md
