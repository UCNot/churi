import {
  ucrxDecodeNumeric,
  ucrxDecodePositive,
  ucrxDecodeRaw,
  ucrxDecodeString,
} from '../impl/ucrx-decode-raw.js';
import { UcEntity } from '../schema/entity/uc-entity.js';
import { UcToken } from '../syntax/uc-token.js';
import { UcrxReject, ucrxRejectEntity, ucrxRejectNull, ucrxRejectType } from './ucrx-rejection.js';
import { Ucrx } from './ucrx.js';

export class VoidUcrx implements Ucrx {

  readonly #set: (value: unknown) => void;

  constructor(set: (value: unknown) => void) {
    this.#set = set;
  }

  get types(): readonly string[] {
    return ['void'];
  }

  bol(value: boolean, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('boolean', this));
  }

  big(value: bigint, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('bigint', this));
  }

  ent(value: readonly UcToken[], reject: UcrxReject): 0 | 1 {
    return this.any(new UcEntity(value)) || reject(ucrxRejectEntity(value));
  }

  att(attribute: string, reject: UcrxReject): Ucrx | undefined;
  att(_attribute: string, _reject: UcrxReject): Ucrx | undefined {
    return;
  }

  nls(reject: UcrxReject): Ucrx | undefined {
    reject(ucrxRejectType('nested list', this));

    return;
  }

  num(value: number, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('number', this));
  }

  raw(value: string, reject: UcrxReject): 0 | 1 {
    return ucrxDecodeRaw(
      this,
      value,
      reject,
      ucrxDecodeString,
      ucrxDecodePositive,
      ucrxDecodeNumeric,
    );
  }

  str(value: string, reject: UcrxReject): 0 | 1 {
    return this.any(value) || reject(ucrxRejectType('string', this));
  }

  for(_key: PropertyKey, reject: UcrxReject): Ucrx | 0 | undefined {
    return reject(ucrxRejectType('map', this));
  }

  map(reject: UcrxReject): 0 | 1 {
    return reject(ucrxRejectType('map', this));
  }

  and(reject: UcrxReject): 0 | 1 {
    return reject(ucrxRejectType('list', this));
  }

  end(reject: UcrxReject): void;
  end(_reject: UcrxReject): void {
    // Not a list.
  }

  nul(reject: UcrxReject): 0 | 1 {
    return this.any(null) || reject(ucrxRejectNull(this));
  }

  protected any(_value: unknown): 0 | 1 {
    return 0;
  }

  protected set(value: unknown): 1 {
    this.#set(value);

    return 1;
  }

}
