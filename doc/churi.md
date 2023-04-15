# `ChURI`

A charged URI is represented by `ChURI` class instance. The latter resembles standard [URL class], except it is
read-only. In addition, it grants access to charges.

Various URI parts could be charged:

- query parameter values,

  ```
  ?range=from(1970-01-01)to(!now)&query=test
  ```

- positional argument immediately following `?` within query,

  ```
  ?range(from(1970-01-01)to(!now))query(test)
  ```

- [Matrix URI] parameter values,

  ```
  /article;slug=hello-world
  ```

- path fragments,

  ```
  /page(2).html
  ```

- URI hash (anchor) parameter values,

  ```
  #tab=expand(!)
  ```

- positional argument immediately following `#` within hash,

  ```
  #tab(expand(!))
  ```

- username and authentication parameters.

  ```
  imap://user;AUTH=LOGIN@localmail/INBOX
  ```

Everything is built on demand. Nothing is parsed until requested.

Given the [example]:

```typescript
import { ChURI } from 'churi';

const { route, searchParams: query } = new ChURI(
  'https://example.com' +
    '/api(!v3.0)' +
    '/user;id=0n302875106592253' +
    '/article;slug=hello-world' +
    '/comments' +
    `?date=since(!date'1970-01-01)till(!now)` +
    '&range=from(10)to(20)',
);

console.debug(route.path);
// /api(!v3.0)/user;id=0n302875106592253/article;slug=hello-world/comments

console.debug(route.name, route.matrix.arg.get('api').value);
// api !v3.0

console.debug(route.at(1).name, route.at(1).matrix.getCharge('id').value);
// user 302875106592253n

console.debug(route.at(2).name, route.at(2).matrix.getCharge('slug').value);
// article hello-world

console.debug(query.getCharge('date').get('since').value);
// 1970-01-01T00:00:00.000Z

console.debug(query.getCharge('range').get('from').value, query.getCharge('range').get('to').value);
// 10 20
```

[example]: ./explanation.md
[URL class]: https://developer.mozilla.org/en-US/docs/Web/API/URL
[Matrix URI]: https://www.w3.org/DesignIssues/MatrixURIs.html

## Charging

The `ChURI` class is read-only. It disallows URI manipulations.

To build Charged URI a tagged template can be used.

The following code reconstructs the URI from example above:

```typescript
import { churi, UcEntity } from 'churi';

console.debug(churi`
  https://example.com
    /api(${new UcEntity('!v3.0')})
    /user;id=${302875106592253n}
    /article;slug=${'hello-world'}
    /comments
      ?date=${{
        since: new UcEntity("!date'1970-01-01"),
        till: new UcEntity('!now'),
      }}
      &range=${{
        from: 10,
        to: 20,
      }}
`);
```

The `UcEntity` above used to add parts to URI as they are. It should be used with care.

Instead, a Charged URI string can be built with `chargeURI()` function.

```typescript
import { chargeURI, UcEntity } from 'churi';

console.debug(
  `https://example.com` +
    `/api(${chargeURI(new UcEntity('!v3.0'))})` +
    `/user;id=${chargeURI(302875106592253n)}` +
    `/article;slug=${chargeURI('hello-world')}` +
    `/comments` +
    `?date=${chargeURI({
      since: new UcEntity("!date'1970-01-01"),
      till: new UcEntity('!now'),
    })}` +
    `&range=${chargeURI({
      from: 10,
      to: 20,
    })}`,
);
```

Charging can be customized by implementing a `toUC()` method declared in `Uctx` interface. If not implemented,
a `toJSON()` method will be used if defined. Otherwise, predefined serialization algorithm will be applied similar
to `JSON.stringify()`.
