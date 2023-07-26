import { UcrxContext } from '../../rx/ucrx-context.js';
import { UcrxInsetLexer } from '../../rx/ucrx-inset-syntax.js';
import { ucrxRejectType } from '../../rx/ucrx-rejection.js';
import { Ucrx } from '../../rx/ucrx.js';
import { UcMeta } from '../../schema/meta/uc-meta.js';
import { UcRejection } from '../../schema/uc-error.js';
import type { URIChargePath } from '../../schema/uri-charge/uri-charge-path.js';
import { ucOpaqueLexer } from '../../syntax/lexers/uc-opaque.lexer.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UcdReader } from '../ucd-reader.js';

export class UcrxHandle implements UcrxContext {

  #reader: UcdReader;
  #rx: Ucrx;
  #_reject: ((rejection: UcRejection) => 0) | undefined;
  #meta: UcMeta.Mutable | undefined;

  #path: UcError$Path;
  #nextPath: UcError$Path | undefined;
  #beforeComma = false;
  #isList: -1 | 0 | 1 = -1;

  constructor(reader: UcdReader, rx: Ucrx, path: UcError$Path) {
    this.#reader = reader;
    this.#rx = rx;
    this.#path = path;
  }

  get rx(): Ucrx {
    return this.#rx;
  }

  get data(): Record<PropertyKey, unknown> {
    return this.#reader.data;
  }

  get opaqueRx(): Ucrx {
    return this.#reader.opaqueRx;
  }

  get meta(): UcMeta.Mutable {
    return (this.#meta ??= UcMeta.create());
  }

  reject(rejection: UcRejection): 0 {
    return (this.#_reject ??= rejection => this.#reject(rejection))(rejection);
  }

  #reject(rejection: UcRejection): 0 {
    const path = (this.#nextPath ?? this.#path).slice() as UcError$Path;

    if (this.#beforeComma) {
      path[path.length - 1].index = 1;
    }
    this.#reader.error({ ...rejection, path });

    return 0;
  }

  onEntity(entity: string): 0 | 1 {
    return this.#reader.entities[entity]?.(this, this.#rx, entity) ?? 0;
  }

  onFormat(format: string, data: readonly UcToken[]): 0 | 1 {
    return this.#reader.formats[format]?.(this, this.#rx, format, data) ?? 0;
  }

  onMeta(attribute: string): Ucrx | undefined {
    return this.#reader.onMeta(this, this.#rx, attribute);
  }

  decode(input: string): void {
    this.#rx.raw(input, this);
  }

  makeOpaque(): void {
    this.#rx = this.opaqueRx;
  }

  att(attr: string): UcrxHandle {
    const attrRx =
      this.#rx.att(attr, this) ?? this.onMeta(attr) ?? /* istanbul ignore next */ this.opaqueRx;

    return new UcrxHandle(this.#reader, attrRx, this.#path);
  }

  bol(value: boolean): void {
    this.#rx.bol(value, this);
  }

  ent(entity: string): void {
    if (!this.onEntity(entity)) {
      // Process entity.
      this.#rx.ent(entity, this);
    }
  }

  fmt(format: string, data: readonly UcToken[]): void {
    if (!this.onFormat(format, data)) {
      this.#rx.fmt(format, data, this);
    }
  }

  ins(id: number | string, emit: (token: UcToken) => void): UcrxInsetLexer {
    const lexer = this.#rx.ins(id, emit, this) ?? this.#reader.inset(id, emit, this);

    if (lexer) {
      return lexer;
    }

    this.#reject({
      code: 'unexpectedInset',
      details: {
        insetId: id,
      },
      message: 'Unrecognized inset',
    });

    return ucOpaqueLexer;
  }

  nls(beforeComma: boolean): UcrxHandle {
    const isList = this.andBeforeNls(beforeComma);
    let itemsRx: Ucrx | undefined;

    if (isList > 0) {
      this.#beforeComma = beforeComma;
      itemsRx = this.#rx.nls(this);
      this.#beforeComma = false;
    }

    const itemPath = this.#path.slice() as UcError$Path;

    itemPath.push({ index: 0 });

    const itemHandle = new UcrxHandle(this.#reader, itemsRx ?? this.opaqueRx, itemPath);

    itemHandle.and();

    return itemHandle;
  }

  str(value: string): void {
    this.#rx.str(value, this);
  }

  emptyStr(): void {
    this.#rx.raw('', this);
  }

  emptyMap(): void {
    this.#rx.map(this);
  }

  onlySuffix(key: string): void {
    this.firstEntry(key).emptyStr();
    this.endMap();
  }

  firstEntry(key: PropertyKey): UcrxHandle {
    const path = this.#path.slice() as UcError$Path;

    path.push({ key });

    this.#nextPath = path;

    const entryRx = this.#rx.for(key, this);

    this.#nextPath = undefined;

    if (entryRx) {
      return new UcrxHandle(this.#reader, entryRx, path);
    }
    if (entryRx != null) {
      this.makeOpaque();
    }

    return new UcrxHandle(this.#reader, this.opaqueRx, path);
  }

  nextEntry(key: PropertyKey): UcrxHandle {
    const path = this.#path.slice() as UcError$Path;

    path.push({ key });

    this.#nextPath = path;

    // Called for subsequent entries.
    // Should never return `0`.
    const entryRx = (this.#rx.for(key, this) as Ucrx | undefined) ?? this.opaqueRx;

    this.#nextPath = undefined;

    return new UcrxHandle(this.#reader, entryRx, path);
  }

  suffix(key: string): void {
    this.nextEntry(key).emptyStr();
  }

  endMap(): void {
    this.#rx.map(this);
  }

  and(beforeComma = false): void {
    if (this.#isList < 0) {
      this.#firstItem();
      this.#beforeComma = beforeComma;
      this.#isList = this.#rx.and(this);
      this.#beforeComma = false;

      if (!this.#isList) {
        this.makeOpaque();
      }
    }
  }

  andBeforeNls(beforeComma: boolean): -1 | 0 | 1 {
    if (this.#isList < 0) {
      this.#firstItem();
      this.#beforeComma = beforeComma;

      this.#_reject = rejection => {
        if (rejection.code === 'unexpectedType' && rejection.details?.type === 'list') {
          // Replace "unexpected list" with "unexpected nested list".
          rejection = ucrxRejectType('nested list', this.#rx);
        }

        return this.#reject(rejection);
      };
      this.#isList = this.#rx.and(this);
      this.#_reject = undefined;

      this.#beforeComma = false;

      if (!this.#isList) {
        this.makeOpaque();
      }

      return this.#isList;
    }

    return this.#isList ? 1 : -1;
  }

  #firstItem(): void {
    this.#path[this.#path.length - 1].index = 0;
  }

  nextItem(): void {
    const last = this.#path[this.#path.length - 1];

    this.#path[this.#path.length - 1] = { ...last, index: last.index! + 1 };
    this.#meta = undefined;
  }

  end(): void {
    if (this.#isList) {
      this.#rx.end(this);
    }
  }

}

type UcError$Path = [UcErrorPath$Head, ...UcErrorPath$Fragment[]];

type UcErrorPath$Head = {
  -readonly [key in keyof URIChargePath.Head]?: URIChargePath.Head[key];
};

type UcErrorPath$Fragment = {
  -readonly [key in keyof URIChargePath.Fragment]?: URIChargePath.Fragment[key];
};
