import { UcrxReject, ucrxRejectType } from '../../rx/ucrx-rejection.js';
import { Ucrx } from '../../rx/ucrx.js';
import type { URIChargePath } from '../../schema/uri-charge/uri-charge-path.js';
import { UcToken } from '../../syntax/uc-token.js';
import { UcdReader } from '../ucd-reader.js';
import { ucdDecodeValue } from './ucd-decode-value.js';

export class UcrxHandle {

  readonly #reader: UcdReader;
  #rx: Ucrx;
  #path: UcError$Path;
  #nextPath: UcError$Path | undefined;
  #reject: UcrxReject;
  #isList: -1 | 0 | 1 = -1;

  constructor(reader: UcdReader, rx: Ucrx, path: UcError$Path) {
    this.#reader = reader;
    this.#rx = rx;
    this.#path = path;
    this.#reject = rejection => {
      const path = this.#nextPath ?? this.#path;

      reader.error({ ...rejection, path: path.slice() as UcError$Path });

      return 0;
    };
  }

  decode(input: string): void {
    ucdDecodeValue(this.#rx, input, this.#reject);
  }

  makeOpaque(): void {
    this.#rx = this.#reader.opaqueRx;
  }

  bol(value: boolean): void {
    this.#rx.bol(value, this.#reject);
  }

  ent(entity: readonly UcToken[]): void {
    if (!this.#reader.entity(this.#rx, entity, this.#reject)) {
      // Process entity.
      this.#rx.ent(entity, this.#reject);
    }
  }

  nls(): UcrxHandle {
    const isList = this.andBeforeNls();
    let itemsRx: Ucrx | undefined;

    if (isList > 0) {
      itemsRx = this.#rx.nls(this.#reject);
    }

    const itemHandle = new UcrxHandle(this.#reader, itemsRx ?? this.#reader.opaqueRx, this.#path);

    itemHandle.and();

    return itemHandle;
  }

  str(value: string): void {
    this.#rx.str(value, this.#reject);
  }

  emptyMap(): void {
    this.#rx.map(this.#reject);
  }

  onlySuffix(key: string): void {
    this.firstEntry(key).str('');
    this.endMap();
  }

  firstEntry(key: PropertyKey): UcrxHandle {
    const path = this.#path.slice() as UcError$Path;

    path.push({ key });

    this.#nextPath = path;

    const entryRx = this.#rx.for(key, this.#reject);

    this.#nextPath = undefined;

    if (entryRx) {
      return new UcrxHandle(this.#reader, entryRx, path);
    }
    if (entryRx != null) {
      this.makeOpaque();
    }

    return new UcrxHandle(this.#reader, this.#reader.opaqueRx, path);
  }

  nextEntry(key: PropertyKey): UcrxHandle {
    const path = this.#path.slice() as UcError$Path;

    path.push({ key });

    this.#nextPath = path;

    // Called for subsequent entries.
    // Should never return `0`.
    const entryRx = (this.#rx.for(key, this.#reject) as Ucrx | undefined) ?? this.#reader.opaqueRx;

    this.#nextPath = undefined;

    return new UcrxHandle(this.#reader, entryRx, path);
  }

  suffix(key: string): void {
    this.nextEntry(key).str('');
  }

  endMap(): void {
    this.#rx.map(this.#reject);
  }

  and(): void {
    if (this.#isList < 0) {
      this.#firstItem();

      this.#isList = this.#rx.and(this.#reject);
      if (!this.#isList) {
        this.makeOpaque();
      }
    }
  }

  andBeforeNls(): -1 | 0 | 1 {
    if (this.#isList < 0) {
      this.#firstItem();

      this.#isList = this.#rx.and(rejection => {
        if (rejection.code === 'unexpectedType' && rejection.details?.type === 'list') {
          // Replace "unexpected list" with "unexpected nested list".
          return this.#reject(ucrxRejectType('nested list', this.#rx));
        }

        return this.#reject(rejection);
      });
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
  }

  end(): void {
    if (this.#isList) {
      this.#rx.end(this.#reject);
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
